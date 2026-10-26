/**
 * branch-dashboard.service.ts — Implementación del servicio de Dashboard para Admin de Sucursal.
 *
 * Principios SOLID:
 * - Single Responsibility (SRP): Responsable exclusivo de la obtención, agregación y mapeo
 *   de datos para el panel de administración de sucursal directo desde la BD.
 * - Dependency Inversion (DIP): Inyecta IHttpClient, desacoplando la capa de red.
 *
 * Fuentes reales (sin mocks ni números por defecto):
 * - Ventas, facturas y ticket promedio del periodo: /administracion/dashboard/metricas (desde/hasta)
 * - Total de ayer (comparativa): /administracion/dashboard/tendencias?agrupacion=dia
 * - Inventario de la sede: /administracion/dashboard/inventario
 * - Facturas del día (gráfica horaria y recientes): /ventas/facturas
 * - Personal de la sede: /administracion/empleados
 * - Cajeros en turno: /ventas/turnos/abiertos
 * La sede llega desde la sesión; el backend vuelve a validar el alcance (RNF-ADM-04).
 */

import { IHttpClient, apiClient } from '@/lib/api';
import { formatCOP } from '@/lib/format/moneda';
import type { FacturaDto, TurnoAbiertoDto } from '@warengine/contracts';
import type { MetricasGanancias, PuntoTendenciaVenta } from '@/features/administracion/types';
import type {
  IBranchDashboardService,
  ObtenerDashboardParams,
} from './branch-dashboard.interface';
import type {
  BranchDashboardData,
  DashboardPeriodo,
  SalesVelocityPoint,
  AlertaStockItem,
  RecentInvoiceItem,
  CashierShiftItem,
} from '../types/branch-dashboard.types';

interface ExistenciaSede {
  sucursalId: number;
  stockActual: number;
  stockMinimo: number;
}

interface ItemInventario {
  productoId: string;
  sku: string;
  nombre: string;
  existenciasPorSucursal: ExistenciaSede[];
}

interface EmpleadoResumen {
  id: string;
}

const INTERVALOS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'] as const;

/** Medianoche local de hace `diasAtras` días. */
function inicioDelDia(diasAtras = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  d.setHours(0, 0, 0, 0);
  return d;
}

function rangoDelPeriodo(periodo: DashboardPeriodo): { desde: Date; hasta: Date } {
  const diasAtras = periodo === '7d' ? 6 : periodo === '30d' ? 29 : 0;
  return { desde: inicioDelDia(diasAtras), hasta: new Date() };
}

/** 'YYYY-MM-DD' local, mismo formato que el `periodo` diario de /dashboard/tendencias. */
function claveDia(fecha: Date): string {
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${m}-${d}`;
}

function intervaloDeHora(hora: number): (typeof INTERVALOS)[number] {
  if (hora < 9) return '08:00';
  if (hora < 11) return '10:00';
  if (hora < 13) return '12:00';
  if (hora < 15) return '14:00';
  if (hora < 17) return '16:00';
  if (hora < 19) return '18:00';
  return '20:00';
}

function horaCorta(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function aLista<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  const items = (res as { items?: unknown })?.items;
  return Array.isArray(items) ? (items as T[]) : [];
}

export class BranchDashboardService implements IBranchDashboardService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  public async obtenerDashboard(params: ObtenerDashboardParams): Promise<BranchDashboardData> {
    const { sucursalId, sucursalNombre } = params;
    const periodo = params.periodo ?? 'hoy';
    const { desde, hasta } = rangoDelPeriodo(periodo);
    const hoy = inicioDelDia(0);
    const ayer = inicioDelDia(1);

    // Métricas e inventario son obligatorios: si fallan, el error llega a la UI (sin ceros falsos).
    const [metricas, inventarioRaw, tendenciasRes, facturasRes, empleadosRes, turnosRes] = await Promise.all([
      this.http.get<MetricasGanancias>('/administracion/dashboard/metricas', {
        params: { sucursalId, desde: desde.toISOString(), hasta: hasta.toISOString() },
      }),
      this.http.get<ItemInventario[]>('/administracion/dashboard/inventario', {
        params: { sucursalIds: sucursalId },
      }),
      // Complementos: si alguno falla se muestra "—" en su bloque, nunca un número inventado.
      this.http
        .get<PuntoTendenciaVenta[]>('/administracion/dashboard/tendencias', {
          params: { sucursalId, agrupacion: 'dia', desde: ayer.toISOString(), hasta: hasta.toISOString() },
        })
        .catch(() => null),
      this.http
        .get<FacturaDto[]>('/ventas/facturas', {
          params: { sucursalId, fechaInicio: hoy.toISOString(), limite: 100 },
        })
        .catch(() => null),
      this.http
        .get<unknown>('/administracion/empleados', { params: { sucursalId } })
        .catch(() => null),
      this.http
        .get<TurnoAbiertoDto[]>('/ventas/turnos/abiertos', { params: { sucursalId } })
        .catch(() => null),
    ]);

    // 1. Ventas y comparativa con ayer (solo tiene sentido para el periodo 'hoy')
    const ingresos = Number(metricas.ingresosTotales ?? 0);
    const totalFacturas = Number(metricas.totalFacturas ?? 0);
    const ticketPromedio = Number(metricas.ticketPromedio ?? 0);

    const puntoAyer = tendenciasRes?.find((p) => p.periodo.slice(0, 10) === claveDia(ayer));
    const totalAyer = tendenciasRes ? Number(puntoAyer?.totalVentas ?? 0) : null;
    const facturasAyer = tendenciasRes ? Number(puntoAyer?.cantidadFacturas ?? 0) : null;
    const variacion = (actual: number, anterior: number | null) =>
      periodo === 'hoy' && anterior !== null && anterior > 0
        ? Math.round(((actual - anterior) / anterior) * 1000) / 10
        : null;

    // 2. Inventario real de la sede (solo filas de esta sucursal)
    const alertas: AlertaStockItem[] = [];
    let totalProductos = 0;
    let stockBajo = 0;
    let agotados = 0;
    for (const item of aLista<ItemInventario>(inventarioRaw)) {
      const exist = item.existenciasPorSucursal?.find((e) => Number(e.sucursalId) === sucursalId);
      if (!exist) continue;
      totalProductos++;
      const stockActual = Number(exist.stockActual ?? 0);
      const stockMinimo = Number(exist.stockMinimo ?? 0);
      if (stockActual <= 0) {
        agotados++;
        alertas.push({ id: item.productoId, sku: item.sku, nombre: item.nombre, stockActual, stockMinimo, estado: 'critico' });
      } else if (stockActual <= stockMinimo) {
        stockBajo++;
        alertas.push({ id: item.productoId, sku: item.sku, nombre: item.nombre, stockActual, stockMinimo, estado: 'bajo' });
      }
    }
    const productosSaludables = totalProductos - stockBajo - agotados;

    // 3. Facturas de hoy: gráfica horaria y operaciones recientes
    const facturasHoy = facturasRes ? aLista<FacturaDto>(facturasRes) : [];
    const acumulado = new Map<string, number>(INTERVALOS.map((h) => [h, 0]));
    let totalHoy = 0;
    for (const f of facturasHoy) {
      if (f.estado !== 'emitida') continue;
      const total = Number(f.total ?? 0);
      totalHoy += total;
      const intervalo = intervaloDeHora(new Date(f.fecha).getHours());
      acumulado.set(intervalo, (acumulado.get(intervalo) ?? 0) + total);
    }
    const puntos: SalesVelocityPoint[] = INTERVALOS.map((hora) => ({ hora, ventasHoy: acumulado.get(hora) ?? 0 }));

    const recientes: RecentInvoiceItem[] = facturasHoy.slice(0, 6).map((f) => ({
      id: f.id,
      numero: `#${f.consecutivo}`,
      hora: horaCorta(f.fecha),
      clienteNombre: '—',
      cajeroNombre: '—',
      total: Number(f.total),
      totalFormateado: formatCOP(Number(f.total)),
      estado: f.estado === 'anulada' ? 'anulada' : 'completada',
    }));

    // 4. Personal y cajeros en turno reales
    const empleados = empleadosRes ? aLista<EmpleadoResumen>(empleadosRes) : [];
    const turnos = turnosRes ?? [];
    const cajerosEnTurno: CashierShiftItem[] = turnos.map((t) => {
      const nombre = t.cajeroNombre || t.cajeroEmail;
      const partes = nombre.split(/[\s@.]+/).filter(Boolean);
      const iniciales = partes.length >= 2 ? `${partes[0][0]}${partes[1][0]}` : nombre.slice(0, 2);
      return {
        id: t.id,
        cajeroNombre: nombre,
        cajeroIniciales: iniciales.toUpperCase(),
        cajaNumero: `Abierto ${horaCorta(t.fechaApertura)}`,
        horaInicio: horaCorta(t.fechaApertura),
        totalVentas: t.totalVentas,
        totalVentasFormateado: formatCOP(t.totalVentas),
        cantidadVentas: t.cantidadVentas,
        estado: 'abierto',
      };
    });

    const fechaFormateada = new Date().toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      sucursalId,
      sucursalNombre,
      fechaOperacion: fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1),
      ultimaSincronizacion: new Date().toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      kpis: {
        ventas: {
          valor: ingresos,
          valorFormateado: formatCOP(ingresos),
          porcentajeCambio: variacion(ingresos, totalAyer),
          tendencia: (variacion(ingresos, totalAyer) ?? 0) >= 0 ? 'sube' : 'baja',
          comparativaTexto:
            periodo !== 'hoy'
              ? `Últimos ${periodo === '7d' ? 7 : 30} días`
              : totalAyer === null
                ? 'Sin datos de ayer'
                : `Ayer: ${formatCOP(totalAyer)}`,
        },
        transacciones: {
          total: totalFacturas,
          porcentajeCambio: variacion(totalFacturas, facturasAyer),
          ticketPromedio,
          ticketPromedioFormateado: formatCOP(ticketPromedio),
        },
        stock: {
          totalProductos,
          totalAlertas: alertas.length,
          stockBajo,
          agotados,
        },
        cajeros: {
          activos: cajerosEnTurno.length,
          total: empleados.length,
          turnosAbiertos: cajerosEnTurno.length,
          disponibles: Math.max(0, empleados.length - cajerosEnTurno.length),
        },
      },
      velocidadVentas: { puntos, totalHoy, totalAyer },
      saludInventario: {
        porcentajeSaludable:
          totalProductos > 0 ? Math.round((productosSaludables / totalProductos) * 1000) / 10 : 0,
        productosSaludables,
        totalProductos,
        stockBajoCount: stockBajo,
        sinExistenciasCount: agotados,
        alertasPrioritarias: alertas.slice(0, 5),
      },
      operacionesRecientes: recientes,
      cajerosEnTurno,
    };
  }
}

export const branchDashboardService = new BranchDashboardService();
