import type { ResultadoPaginado } from '@warengine/shared-kernel';
import { CategoriaActivo } from '../entities/CategoriaActivo.ts';

export interface FiltrosListarCategoriasActivos {
  busqueda?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}

export interface ICategoriaActivoRepository {
  listar(filtros: FiltrosListarCategoriasActivos): Promise<ResultadoPaginado<CategoriaActivo>>;
  findById(id: number): Promise<CategoriaActivo | null>;
  findByNombre(nombre: string): Promise<CategoriaActivo | null>;
  crear(datos: { nombre: string }): Promise<CategoriaActivo>;
  actualizar(id: number, cambios: { nombre: string }): Promise<CategoriaActivo>;
  cambiarEstado(id: number, isActive: boolean): Promise<CategoriaActivo>;
}
