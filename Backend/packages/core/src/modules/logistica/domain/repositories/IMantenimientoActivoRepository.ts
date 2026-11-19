import type { ResultadoPaginado } from '@warengine/shared-kernel';
import { MantenimientoActivo, TipoMantenimiento } from '../entities/MantenimientoActivo.ts';

export interface DatosCrearMantenimiento {
  activoId: string;
  proveedorId: number | null;
  tipo: TipoMantenimiento;
  /** YYYY-MM-DD; si es null la BD usa CURDATE(). */
  fecha: string | null;
  costo: number | null;
  descripcion: string | null;
}

export interface DatosFinalizarMantenimiento {
  fechaFin: string;
  costo?: number;
  descripcion?: string;
}

export interface MantenimientoActivoDetallado {
  id: string;
  activoId: string;
  activoCodigo: string;
  activoNombre: string;
  sucursalId: number;
  proveedorId: number | null;
  proveedorNombre: string | null;
  tipo: TipoMantenimiento;
  fecha: string;
  fechaFin: string | null;
  costo: number | null;
  descripcion: string | null;
  enCurso: boolean;
}

export interface FiltrosListarMantenimientos {
  sucursalIds?: number[];
  activoId?: string;
  tipo?: TipoMantenimiento;
  estado?: 'todos' | 'en_curso' | 'finalizado';
  desde?: string;
  hasta?: string;
  page: number;
  limit: number;
}

export interface ResumenMantenimientos {
  total: number;
  enCurso: number;
  finalizados: number;
  vencidos: number;
}

export interface IMantenimientoActivoRepository {
  crear(datos: DatosCrearMantenimiento): Promise<MantenimientoActivo>;
  findById(id: string): Promise<MantenimientoActivo | null>;
  findEnCursoPorActivo(activoId: string): Promise<MantenimientoActivo | null>;
  /** Bitacora tecnica acumulada (mas reciente primero). */
  listarPorActivo(activoId: string): Promise<MantenimientoActivo[]>;
  /** Llena fecha_fin; el trigger devuelve el activo a 'disponible'. */
  finalizar(id: string, datos: DatosFinalizarMantenimiento): Promise<MantenimientoActivo>;
  listarPaginado?(filtros: FiltrosListarMantenimientos): Promise<ResultadoPaginado<MantenimientoActivoDetallado>>;
  obtenerResumen?(sucursalIds?: number[]): Promise<ResumenMantenimientos>;
}
