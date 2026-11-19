/**
 * branch-assets.service.ts — Implementación del servicio de Activos de la Sucursal.
 *
 * Principio SOLID: Single Responsibility Principle (SRP) e Inversión de Dependencias (DIP).
 */

import { IHttpClient, apiClient } from '@/lib/api';
import type { IBranchAssetsService } from './branch-assets.interface';
import type {
  ActivoSede,
  ActivosFiltros,
  ActivosResultadoPaginado,
  CrearActivoDTO,
  EditarActivoDTO,
  DarBajaActivoDTO,
  AsignarActivoEmpleadoDTO,
  AsignarActivoAreaDTO,
  DevolverActivoDTO,
  MantenimientoSede,
  MantenimientosFiltros,
  MantenimientosResultadoPaginado,
  RegistrarMantenimientoDTO,
  FinalizarMantenimientoDTO,
  CategoriaActivoSede,
  CategoriasActivosFiltros,
  CategoriasActivosResultadoPaginado,
  CrearCategoriaActivoDTO,
  EditarCategoriaActivoDTO,
} from '../types/branch-assets.types';

export class BranchAssetsService implements IBranchAssetsService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  private mapActivo(r: any): ActivoSede {
    return {
      id: String(r.id),
      codigoActivo: String(r.codigoActivo || r.codigo_activo || ''),
      nombre: String(r.nombre || ''),
      categoriaActivoId: r.categoriaActivoId ? Number(r.categoriaActivoId) : (r.categoria_activo_id ? Number(r.categoria_activo_id) : null),
      categoriaNombre: r.categoriaNombre || r.categoria_nombre || null,
      sucursalId: Number(r.sucursalId || r.sucursal_id || 0),
      estado: r.estado || 'disponible',
      valorAdquisicion: r.valorAdquisicion !== null && r.valorAdquisicion !== undefined
        ? Number(r.valorAdquisicion)
        : (r.valor_adquisicion !== null && r.valor_adquisicion !== undefined ? Number(r.valor_adquisicion) : null),
      fechaAdquisicion: r.fechaAdquisicion || r.fecha_adquisicion || null,
      condicion: r.condicion || null,
      isActive: Boolean(r.isActive ?? r.is_active ?? true),
      custodioActual: r.custodioActual ? {
        id: String(r.custodioActual.id),
        nombre: String(r.custodioActual.nombre),
        tipo: r.custodioActual.tipo,
        fechaAsignacion: String(r.custodioActual.fechaAsignacion || r.custodioActual.fecha_asignacion || ''),
        fechaDevolucionEsperada: r.custodioActual.fechaDevolucionEsperada || r.custodioActual.fecha_devolucion_esperada || null,
        observaciones: r.custodioActual.observaciones || null,
      } : null,
      historialMantenimientos: Array.isArray(r.historialMantenimientos)
        ? r.historialMantenimientos.map((m: any) => ({
            id: String(m.id),
            tipo: m.tipo,
            fecha: String(m.fecha),
            fechaFin: m.fechaFin || m.fecha_fin || null,
            costo: m.costo !== null && m.costo !== undefined ? Number(m.costo) : null,
            proveedorNombre: m.proveedorNombre || m.proveedor_nombre || null,
            descripcion: m.descripcion || null,
          }))
        : undefined,
    };
  }

  private mapMantenimiento(m: any): MantenimientoSede {
    return {
      id: String(m.id),
      activoId: String(m.activoId || m.activo_id || ''),
      activoCodigo: String(m.activoCodigo || m.activo_codigo || ''),
      activoNombre: String(m.activoNombre || m.activo_nombre || ''),
      sucursalId: Number(m.sucursalId || m.sucursal_id || 0),
      proveedorId: m.proveedorId ? Number(m.proveedorId) : (m.proveedor_id ? Number(m.proveedor_id) : null),
      proveedorNombre: m.proveedorNombre || m.proveedor_nombre || null,
      tipo: m.tipo || 'preventivo',
      fecha: String(m.fecha || ''),
      fechaFin: m.fechaFin || m.fecha_fin || null,
      costo: m.costo !== null && m.costo !== undefined ? Number(m.costo) : null,
      descripcion: m.descripcion || null,
      enCurso: Boolean(m.enCurso ?? (m.fechaFin === null || m.fecha_fin === null)),
    };
  }

  private mapCategoria(c: any): CategoriaActivoSede {
    return {
      id: Number(c.id || c.id_categoria_activo),
      nombre: String(c.nombre || ''),
      isActive: Boolean(c.isActive ?? c.is_active ?? true),
      cantidadActivos: Number(c.cantidadActivos || c.cantidad_activos || 0),
    };
  }

  public async listarActivos(
    sucursalId: number,
    filtros?: ActivosFiltros,
  ): Promise<ActivosResultadoPaginado> {
    const params: Record<string, string | number | undefined> = {
      sucursalId,
      limit: filtros?.limit ?? 15,
      page: filtros?.page ?? 1,
    };

    if (filtros?.busqueda?.trim()) {
      params.busqueda = filtros.busqueda.trim();
    }
    if (filtros?.categoriaActivoId !== undefined && filtros.categoriaActivoId !== null) {
      params.categoriaActivoId = filtros.categoriaActivoId;
    }
    if (filtros?.estado) {
      params.estado = filtros.estado;
    }
    if (filtros?.areaId !== undefined && filtros.areaId !== null) {
      params.areaId = filtros.areaId;
    }

    const res = await this.http.get<any>('/logistica/activos', { params });
    const rawItems = Array.isArray(res) ? res : (res?.items || []);
    const items = rawItems.map((r: any) => this.mapActivo(r));
    const total = Number(res?.total ?? items.length);
    const limit = Number(res?.limit ?? (filtros?.limit ?? 15));
    const totalPages = Number(res?.totalPages ?? (Math.ceil(total / limit) || 1));
    const page = Number(res?.page ?? (filtros?.page ?? 1));

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      resumen: res?.resumen ? {
        total: Number(res.resumen.total || 0),
        disponibles: Number(res.resumen.disponibles || 0),
        asignados: Number(res.resumen.asignados || 0),
        enMantenimiento: Number(res.resumen.enMantenimiento || 0),
        deBaja: Number(res.resumen.deBaja || 0),
        valorTotal: Number(res.resumen.valorTotal || 0),
      } : undefined,
    };
  }

  public async obtenerActivo(id: string): Promise<ActivoSede> {
    const res = await this.http.get<any>(`/logistica/activos/${id}`);
    return this.mapActivo(res);
  }

  public async crearActivo(datos: CrearActivoDTO): Promise<ActivoSede> {
    const res = await this.http.post<any>('/logistica/activos', datos);
    return this.mapActivo(res);
  }

  public async editarActivo(id: string, datos: EditarActivoDTO): Promise<ActivoSede> {
    const res = await this.http.put<any>(`/logistica/activos/${id}`, datos);
    return this.mapActivo(res);
  }

  public async darBajaActivo(id: string, datos: DarBajaActivoDTO): Promise<ActivoSede> {
    const res = await this.http.put<any>(`/logistica/activos/${id}/baja`, datos);
    return this.mapActivo(res);
  }

  public async asignarEmpleado(id: string, datos: AsignarActivoEmpleadoDTO): Promise<any> {
    return this.http.post<any>(`/logistica/activos/${id}/asignar-empleado`, datos);
  }

  public async asignarArea(id: string, datos: AsignarActivoAreaDTO): Promise<any> {
    return this.http.post<any>(`/logistica/activos/${id}/asignar-area`, datos);
  }

  public async devolverActivo(id: string, datos?: DevolverActivoDTO): Promise<any> {
    return this.http.put<any>(`/logistica/activos/${id}/devolver`, datos ?? {});
  }

  public async listarMantenimientos(
    sucursalId: number,
    filtros?: MantenimientosFiltros,
  ): Promise<MantenimientosResultadoPaginado> {
    const params: Record<string, string | number | undefined> = {
      sucursalId,
      limit: filtros?.limit ?? 15,
      page: filtros?.page ?? 1,
    };

    if (filtros?.activoId) params.activoId = filtros.activoId;
    if (filtros?.tipo) params.tipo = filtros.tipo;
    if (filtros?.estado && filtros.estado !== 'todos') params.estado = filtros.estado;
    if (filtros?.desde) params.desde = filtros.desde;
    if (filtros?.hasta) params.hasta = filtros.hasta;

    const res = await this.http.get<any>('/logistica/mantenimientos', { params });
    const rawItems = Array.isArray(res) ? res : (res?.items || []);
    const items = rawItems.map((m: any) => this.mapMantenimiento(m));
    const total = Number(res?.total ?? items.length);
    const limit = Number(res?.limit ?? (filtros?.limit ?? 15));
    const totalPages = Number(res?.totalPages ?? (Math.ceil(total / limit) || 1));
    const page = Number(res?.page ?? (filtros?.page ?? 1));

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      resumen: res?.resumen ? {
        total: Number(res.resumen.total || 0),
        enCurso: Number(res.resumen.enCurso || 0),
        finalizados: Number(res.resumen.finalizados || 0),
        vencidos: Number(res.resumen.vencidos || 0),
      } : undefined,
    };
  }

  public async registrarMantenimiento(activoId: string, datos: RegistrarMantenimientoDTO): Promise<any> {
    return this.http.post<any>(`/logistica/activos/${activoId}/mantenimientos`, datos);
  }

  public async finalizarMantenimiento(id: string, datos: FinalizarMantenimientoDTO): Promise<any> {
    return this.http.put<any>(`/logistica/mantenimientos/${id}/finalizar`, datos);
  }

  public async listarCategorias(filtros?: CategoriasActivosFiltros): Promise<CategoriasActivosResultadoPaginado> {
    const params: Record<string, string | number | boolean | undefined> = {
      limit: filtros?.limit ?? 50,
      page: filtros?.page ?? 1,
    };

    if (filtros?.busqueda?.trim()) params.busqueda = filtros.busqueda.trim();
    if (filtros?.isActive !== undefined) params.isActive = filtros.isActive;

    const res = await this.http.get<any>('/logistica/categorias-activos', { params });
    const rawItems = Array.isArray(res) ? res : (res?.items || []);
    const items = rawItems.map((c: any) => this.mapCategoria(c));
    const total = Number(res?.total ?? items.length);
    const limit = Number(res?.limit ?? (filtros?.limit ?? 50));
    const totalPages = Number(res?.totalPages ?? (Math.ceil(total / limit) || 1));
    const page = Number(res?.page ?? (filtros?.page ?? 1));

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  public async crearCategoria(datos: CrearCategoriaActivoDTO): Promise<CategoriaActivoSede> {
    const res = await this.http.post<any>('/logistica/categorias-activos', datos);
    return this.mapCategoria(res);
  }

  public async editarCategoria(id: number, datos: EditarCategoriaActivoDTO): Promise<CategoriaActivoSede> {
    const res = await this.http.put<any>(`/logistica/categorias-activos/${id}`, datos);
    return this.mapCategoria(res);
  }

  public async cambiarEstadoCategoria(id: number, isActive: boolean): Promise<CategoriaActivoSede> {
    const res = await this.http.put<any>(`/logistica/categorias-activos/${id}/estado`, { isActive });
    return this.mapCategoria(res);
  }
}

export const branchAssetsService = new BranchAssetsService();
