/**
 * branch-staff.service.ts — Implementación del servicio de personal de sucursal y turnos de caja.
 * 
 * Principios SOLID:
 * - Single Responsibility Principle (SRP): Gestión exclusiva de colaboradores y turnos POS.
 * - Dependency Inversion Principle (DIP): Inyecta IHttpClient desacoplando la capa de red.
 */

import { IHttpClient, apiClient } from '@/lib/api';
import type { IBranchStaffService } from './branch-staff.interface';
import type {
  EmpleadoSede,
  EmpleadosFiltros,
  EmpleadosResultadoPaginado,
  EditarEmpleadoDTO,
  TurnoCajaActivo,
  AbrirTurnoDTO,
  CerrarTurnoDTO,
  CierreAdministrativoInput,
  HistorialTurnosFiltros,
  HistorialTurnosResultado,
  TurnoCorteDetalle,
} from '../types/branch-staff.types';

export class BranchStaffService implements IBranchStaffService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  public async listarEmpleados(
    sucursalId: number,
    filtros?: { isActive?: boolean; areaId?: number },
  ): Promise<EmpleadoSede[]> {
    const params: Record<string, any> = { sucursalId };
    if (filtros?.isActive !== undefined) {
      params.isActive = filtros.isActive ? 'true' : 'false';
    }
    if (filtros?.areaId !== undefined) {
      params.areaId = filtros.areaId;
    }

    const res = await this.http.get<any>('/administracion/empleados', { params });
    const items = Array.isArray(res) ? res : res?.items || [];

    return items.map((e: any) => this.mapEmpleado(e, sucursalId));
  }

  public async listarEmpleadosPaginado(
    sucursalId: number,
    filtros?: EmpleadosFiltros,
  ): Promise<EmpleadosResultadoPaginado> {
    const params: Record<string, any> = {
      sucursalId,
      page: filtros?.page ?? 1,
      limite: filtros?.limite ?? 10,
    };
    if (filtros?.q?.trim()) {
      params.busqueda = filtros.q.trim();
    }
    if (filtros?.cargo?.trim()) {
      params.cargo = filtros.cargo.trim();
    }
    if (filtros?.isActive !== undefined) {
      params.isActive = filtros.isActive ? 'true' : 'false';
    }

    const res = await this.http.get<any>('/administracion/empleados', { params });

    if (Array.isArray(res)) {
      const items = res.map((e: any) => this.mapEmpleado(e, sucursalId));
      return {
        items,
        total: items.length,
        totalPaginas: 1,
        page: 1,
        limite: items.length,
      };
    }

    const items = (res?.items || []).map((e: any) => this.mapEmpleado(e, sucursalId));
    return {
      items,
      total: Number(res?.total ?? items.length),
      totalPaginas: Number(res?.totalPaginas ?? 1),
      page: Number(res?.page ?? params.page),
      limite: Number(res?.limite ?? params.limite),
    };
  }

  public async obtenerEmpleado(id: string): Promise<EmpleadoSede> {
    const e = await this.http.get<any>(`/administracion/empleados/${id}`);
    return this.mapEmpleado(e);
  }

  public async editarEmpleado(id: string, data: EditarEmpleadoDTO): Promise<EmpleadoSede> {
    const payload: Record<string, any> = {};
    if (data.nombre !== undefined) payload.nombre = data.nombre.trim();
    if (data.telefono !== undefined) payload.telefono = data.telefono?.trim() || null;
    if (data.direccion !== undefined) payload.direccion = data.direccion?.trim() || null;
    if (data.cargo !== undefined) payload.cargo = data.cargo?.trim() || null;
    if (data.areaId !== undefined) payload.areaId = data.areaId ? Number(data.areaId) : null;
    if (data.isActive !== undefined) payload.isActive = Boolean(data.isActive);

    const res = await this.http.put<any>(`/administracion/empleados/${id}`, payload);
    return this.mapEmpleado(res);
  }

  public async obtenerTurnoActual(): Promise<TurnoCajaActivo | null> {
    try {
      const res = await this.http.get<any>('/ventas/turnos/actual');
      const turno = res?.turno ?? res;
      if (!turno || !turno.id) return null;
      return {
        id: String(turno.id || turno.id_turno_caja),
        usuarioId: String(turno.usuarioId || turno.usuario_id),
        usuarioNombre: turno.cajeroNombre || turno.usuarioNombre || 'Cajero en Turno',
        sucursalId: Number(turno.sucursalId || turno.sucursal_id || 0),
        fondoInicial: Number(turno.fondoInicial ?? turno.fondo_inicial ?? 0),
        fondoFinal: turno.fondoFinal !== undefined && turno.fondoFinal !== null ? Number(turno.fondoFinal) : null,
        diferencia: turno.diferencia !== undefined && turno.diferencia !== null ? Number(turno.diferencia) : null,
        fechaApertura: turno.fechaApertura || turno.fecha_apertura,
        fechaCierre: turno.fechaCierre || turno.fecha_cierre || null,
        totalVentas: Number(turno.totalVentas || 0),
        cantidadVentas: Number(turno.cantidadVentas || 0),
        efectivoEsperado: turno.efectivoEsperado !== undefined ? Number(turno.efectivoEsperado) : undefined,
        estado: (turno.fechaCierre || turno.fecha_cierre) ? 'cerrado' : 'abierto',
      };
    } catch {
      return null;
    }
  }

  public async listarTurnosActivos(sucursalId?: number): Promise<TurnoCajaActivo[]> {
    const params: Record<string, any> = {};
    if (sucursalId) params.sucursalId = sucursalId;

    const res = await this.http.get<any>('/ventas/turnos/abiertos', { params });
    const list = Array.isArray(res) ? res : res?.items || [];

    return list.map((t: any) => {
      const fondoInicial = Number(t.fondoInicial ?? t.fondo_inicial ?? 0);
      const totalVentas = Number(t.totalVentas ?? 0);
      return {
        id: String(t.id || t.id_turno_caja),
        usuarioId: String(t.usuarioId || t.usuario_id),
        usuarioNombre: t.cajeroNombre || t.usuarioNombre || t.cajeroEmail || 'Cajero',
        cajeroNombre: t.cajeroNombre || null,
        cajeroEmail: t.cajeroEmail || '',
        sucursalId: Number(t.sucursalId || t.sucursal_id || sucursalId || 0),
        fondoInicial,
        fechaApertura: t.fechaApertura || t.fecha_apertura,
        fechaCierre: null,
        totalVentas,
        cantidadVentas: Number(t.cantidadVentas ?? 0),
        efectivoEsperado: t.efectivoEsperado !== undefined ? Number(t.efectivoEsperado) : (fondoInicial + totalVentas),
        estado: 'abierto',
      };
    });
  }

  public async abrirTurno(dto: AbrirTurnoDTO): Promise<TurnoCajaActivo> {
    const res = await this.http.post<any>('/ventas/turnos', {
      fondoInicial: Number(dto.fondoInicial),
    });
    return {
      id: String(res.id || res.id_turno_caja),
      usuarioId: String(res.usuarioId || res.usuario_id),
      usuarioNombre: res.usuarioNombre || 'Cajero en Turno',
      sucursalId: Number(res.sucursalId || res.sucursal_id || 0),
      fondoInicial: Number(res.fondoInicial ?? dto.fondoInicial),
      fechaApertura: res.fechaApertura || new Date(),
      estado: 'abierto',
      totalVentas: 0,
      cantidadVentas: 0,
    };
  }

  public async cerrarTurno(turnoId: string, dto: CerrarTurnoDTO): Promise<any> {
    return await this.http.post<any>(`/ventas/turnos/${turnoId}/cerrar`, {
      fondoFinal: Number(dto.fondoFinal),
    });
  }

  public async cerrarTurnoAdministrativo(
    turnoId: string,
    data: CierreAdministrativoInput,
  ): Promise<any> {
    const payload: Record<string, any> = {
      motivo: data.motivo.trim(),
    };
    if (data.fondoFinal !== undefined && data.fondoFinal !== null && !isNaN(Number(data.fondoFinal))) {
      payload.fondoFinal = Number(data.fondoFinal);
    }
    return await this.http.post<any>(`/ventas/turnos/${turnoId}/cierre-administrativo`, payload);
  }

  public async listarHistorialTurnos(
    sucursalId: number,
    filtros?: HistorialTurnosFiltros,
  ): Promise<HistorialTurnosResultado> {
    const params: Record<string, any> = {
      sucursalId,
      page: filtros?.page ?? 1,
      limite: filtros?.limite ?? 10,
    };
    if (filtros?.desde) params.desde = filtros.desde;
    if (filtros?.hasta) params.hasta = filtros.hasta;
    if (filtros?.usuarioId) params.usuarioId = filtros.usuarioId;
    if (filtros?.tipoCierre) params.tipoCierre = filtros.tipoCierre;
    if (filtros?.conDiferencia) params.conDiferencia = 'true';

    const res = await this.http.get<any>('/ventas/turnos/historial', { params });
    const items = (res?.items || []).map((t: any) => ({
      id: String(t.id),
      usuarioId: String(t.usuarioId),
      cajeroNombre: t.cajeroNombre || null,
      cajeroEmail: t.cajeroEmail || '',
      sucursalId: Number(t.sucursalId || sucursalId),
      sucursalNombre: t.sucursalNombre || null,
      cajaNombre: t.cajaNombre || 'Caja 1',
      fondoInicial: Number(t.fondoInicial || 0),
      fondoFinal: t.fondoFinal !== null && t.fondoFinal !== undefined ? Number(t.fondoFinal) : null,
      diferencia: t.diferencia !== null && t.diferencia !== undefined ? Number(t.diferencia) : null,
      fechaApertura: String(t.fechaApertura),
      fechaCierre: String(t.fechaCierre),
      tipoCierre: (t.tipoCierre as 'normal' | 'administrativo') || 'normal',
      cerradoPor: t.cerradoPor || null,
      cerradoPorNombre: t.cerradoPorNombre || null,
      motivoCierre: t.motivoCierre || null,
      totalVendido: Number(t.totalVendido || 0),
      cantidadVentas: Number(t.cantidadVentas || 0),
      efectivoEsperado: Number(t.efectivoEsperado || 0),
    }));

    return {
      items,
      total: Number(res?.total ?? items.length),
      totalPaginas: Number(res?.totalPaginas ?? 1),
      page: Number(res?.page ?? params.page),
      limite: Number(res?.limite ?? params.limite),
    };
  }

  public async obtenerCorteTurno(turnoId: string): Promise<TurnoCorteDetalle> {
    const res = await this.http.get<any>(`/ventas/turnos/${turnoId}/corte`);
    return {
      id: String(res.id),
      usuarioId: String(res.usuarioId),
      cajeroNombre: res.cajeroNombre || null,
      cajeroEmail: res.cajeroEmail || '',
      sucursalId: Number(res.sucursalId || 0),
      sucursalNombre: res.sucursalNombre || '',
      cajaNombre: res.cajaNombre || 'Caja 1',
      fondoInicial: Number(res.fondoInicial || 0),
      fondoFinal: res.fondoFinal !== null && res.fondoFinal !== undefined ? Number(res.fondoFinal) : null,
      diferencia: res.diferencia !== null && res.diferencia !== undefined ? Number(res.diferencia) : null,
      fechaApertura: String(res.fechaApertura),
      fechaCierre: res.fechaCierre ? String(res.fechaCierre) : null,
      tipoCierre: (res.tipoCierre as 'normal' | 'administrativo') || 'normal',
      cerradoPor: res.cerradoPor || null,
      cerradoPorNombre: res.cerradoPorNombre || null,
      motivoCierre: res.motivoCierre || null,
      cantidadVentas: Number(res.cantidadVentas || 0),
      totalVentas: Number(res.totalVentas || 0),
      ventasPorMetodo: {
        efectivo: Number(res.ventasPorMetodo?.efectivo || 0),
        tarjeta: Number(res.ventasPorMetodo?.tarjeta || 0),
        transferencia: Number(res.ventasPorMetodo?.transferencia || 0),
        credito_corporativo: Number(res.ventasPorMetodo?.credito_corporativo || 0),
      },
      efectivoEsperado: Number(res.efectivoEsperado || 0),
    };
  }

  private mapEmpleado(e: any, sucursalIdFallback = 0): EmpleadoSede {
    return {
      id: String(e.id || e.id_empleado),
      tipoDocumento: e.tipoDocumento || e.tipo_documento || 'CC',
      numeroDocumento: e.numeroDocumento || e.numero_documento || '',
      nombre: e.nombre || 'Sin nombre',
      telefono: e.telefono || null,
      direccion: e.direccion || null,
      cargo: e.cargo || 'Colaborador',
      areaId: e.areaId ? Number(e.areaId) : null,
      areaNombre: e.areaNombre || null,
      sucursalId: Number(e.sucursalId || e.sucursal_id || sucursalIdFallback),
      sucursalNombre: e.sucursalNombre ?? '',
      fechaIngreso: e.fechaIngreso || e.fecha_ingreso || '',
      sueldoActual: e.sueldoActual !== null && e.sueldoActual !== undefined ? Number(e.sueldoActual) : null,
      isActive: Boolean(e.isActive ?? e.is_active ?? true),
    };
  }
}

export const branchStaffService = new BranchStaffService();
