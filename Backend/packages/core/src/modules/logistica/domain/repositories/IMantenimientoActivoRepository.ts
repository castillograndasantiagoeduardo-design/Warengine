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

export interface IMantenimientoActivoRepository {
  crear(datos: DatosCrearMantenimiento): Promise<MantenimientoActivo>;
  findById(id: string): Promise<MantenimientoActivo | null>;
  findEnCursoPorActivo(activoId: string): Promise<MantenimientoActivo | null>;
  /** Bitacora tecnica acumulada (mas reciente primero). */
  listarPorActivo(activoId: string): Promise<MantenimientoActivo[]>;
  /** Llena fecha_fin; el trigger devuelve el activo a 'disponible'. */
  finalizar(id: string, datos: DatosFinalizarMantenimiento): Promise<MantenimientoActivo>;
}
