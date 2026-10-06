import { Categoria } from '../entities/Categoria.ts';

export interface DatosCrearCategoria {
  nombre: string;
}

export interface DatosActualizarCategoria {
  nombre?: string;
  isActive?: boolean;
}

export interface FiltrosListarCategorias {
  busqueda?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}

export interface ResultadoPaginado<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ICategoriaRepository {
  listar(filtros: FiltrosListarCategorias): Promise<ResultadoPaginado<Categoria>>;
  listarActivos(): Promise<Categoria[]>;
  findById(id: number): Promise<Categoria | null>;
  crear(datos: DatosCrearCategoria): Promise<Categoria>;
  actualizar(id: number, cambios: DatosActualizarCategoria): Promise<Categoria>;
  cambiarEstado(id: number, isActive: boolean): Promise<Categoria>;
}
