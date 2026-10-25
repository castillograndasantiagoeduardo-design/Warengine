import type { ResultadoPaginado } from '@warengine/shared-kernel';
import { Activo, EstadoActivo } from '../entities/Activo.ts';

export interface DatosCrearActivo {
  codigoActivo: string;
  nombre: string;
  categoriaActivoId: number | null;
  sucursalId: number;
  valorAdquisicion: number | null;
  fechaAdquisicion: string | null;
  condicion: string | null;
}

export interface FiltrosListarActivos {
  /** `undefined` = sin restriccion de sucursal (alcance global). */
  sucursalIds?: number[];
  categoriaActivoId?: number;
  /** Filtra por el area que tiene la custodia vigente del activo. */
  areaId?: number;
  estado?: EstadoActivo;
  busqueda?: string;
  page: number;
  limit: number;
}

export interface IActivoRepository {
  listar(filtros: FiltrosListarActivos): Promise<ResultadoPaginado<Activo>>;
  findById(id: string): Promise<Activo | null>;
  findByCodigo(codigoActivo: string): Promise<Activo | null>;
  /** El estado inicial 'disponible' lo fija la BD (DEFAULT). */
  crear(datos: DatosCrearActivo): Promise<Activo>;
  /** Unica transicion de estado que hace el backend a mano; las demas las hacen los triggers. */
  marcarBaja(id: string): Promise<Activo>;
}
