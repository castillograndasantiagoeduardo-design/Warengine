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
  EditarEmpleadoDTO,
  TurnoCajaActivo,
  AbrirTurnoDTO,
  CerrarTurnoDTO,
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

    return items.map((e: any) => ({
      id: String(e.id || e.id_empleado),
      tipoDocumento: e.tipoDocumento || e.tipo_documento || 'CC',
      numeroDocumento: e.numeroDocumento || e.numero_documento || '',
      nombre: e.nombre || 'Sin nombre',
      telefono: e.telefono || null,
      direccion: e.direccion || null,
      cargo: e.cargo || 'Colaborador',
      areaId: e.areaId ? Number(e.areaId) : null,
      areaNombre: e.areaNombre || null,
      sucursalId: Number(e.sucursalId || e.sucursal_id || sucursalId),
      sucursalNombre: e.sucursalNombre || 'Sede Norte',
      fechaIngreso: e.fechaIngreso || e.fecha_ingreso || '',
      sueldoActual: e.sueldoActual ? Number(e.sueldoActual) : null,
      isActive: Boolean(e.isActive ?? e.is_active ?? true),
    }));
  }

  public async obtenerEmpleado(id: string): Promise<EmpleadoSede> {
    const e = await this.http.get<any>(`/administracion/empleados/${id}`);
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
      sucursalId: Number(e.sucursalId || e.sucursal_id || 1),
      sucursalNombre: e.sucursalNombre || 'Sede Norte',
      fechaIngreso: e.fechaIngreso || e.fecha_ingreso || '',
      sueldoActual: e.sueldoActual ? Number(e.sueldoActual) : null,
      isActive: Boolean(e.isActive ?? e.is_active ?? true),
    };
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
    return {
      id: String(res.id || id),
      tipoDocumento: res.tipoDocumento || 'CC',
      numeroDocumento: res.numeroDocumento || '',
      nombre: res.nombre || '',
      telefono: res.telefono || null,
      direccion: res.direccion || null,
      cargo: res.cargo || null,
      areaId: res.areaId ? Number(res.areaId) : null,
      areaNombre: res.areaNombre || null,
      sucursalId: Number(res.sucursalId || 1),
      sucursalNombre: res.sucursalNombre || 'Sede Norte',
      fechaIngreso: res.fechaIngreso || '',
      sueldoActual: res.sueldoActual ? Number(res.sueldoActual) : null,
      isActive: Boolean(res.isActive ?? true),
    };
  }

  public async obtenerTurnoActual(): Promise<TurnoCajaActivo | null> {
    try {
      const res = await this.http.get<any>('/ventas/turnos/actual');
      if (!res || !res.id) return null;
      return {
        id: String(res.id || res.id_turno_caja),
        usuarioId: String(res.usuarioId || res.usuario_id),
        usuarioNombre: res.usuarioNombre || 'Cajero en Turno',
        sucursalId: Number(res.sucursalId || res.sucursal_id || 1),
        fondoInicial: Number(res.fondoInicial ?? res.fondo_inicial ?? 0),
        fondoFinal: res.fondoFinal !== undefined ? Number(res.fondoFinal) : null,
        diferencia: res.diferencia !== undefined ? Number(res.diferencia) : null,
        fechaApertura: res.fechaApertura || res.fecha_apertura,
        fechaCierre: res.fechaCierre || res.fecha_cierre || null,
        totalVentas: Number(res.totalVentas || 0),
        cantidadVentas: Number(res.cantidadVentas || 0),
        estado: (res.fechaCierre || res.fecha_cierre) ? 'cerrado' : 'abierto',
      };
    } catch {
      return null;
    }
  }

  public async abrirTurno(dto: AbrirTurnoDTO): Promise<TurnoCajaActivo> {
    const res = await this.http.post<any>('/ventas/turnos', {
      fondoInicial: Number(dto.fondoInicial),
    });
    return {
      id: String(res.id || res.id_turno_caja),
      usuarioId: String(res.usuarioId || res.usuario_id),
      usuarioNombre: res.usuarioNombre || 'Cajero en Turno',
      sucursalId: Number(res.sucursalId || res.sucursal_id || 1),
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
}

export const branchStaffService = new BranchStaffService();
