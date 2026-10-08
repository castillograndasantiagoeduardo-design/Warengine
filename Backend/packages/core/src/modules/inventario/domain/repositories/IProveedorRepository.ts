import { Proveedor } from '../entities/Proveedor.ts';
import { ResultadoPaginado } from './ICategoriaRepository.ts';

export interface DatosCrearProveedor {
  nombre: string;
  contacto?: string | null;
}

export interface DatosActualizarProveedor {
  nombre?: string;
  contacto?: string | null;
  isActive?: boolean;
}

export interface FiltrosListarProveedores {
  busqueda?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}

export interface IProveedorRepository {
  listar(filtros: FiltrosListarProveedores): Promise<ResultadoPaginado<Proveedor>>;
  listarActivos(): Promise<Proveedor[]>;
  findById(id: number): Promise<Proveedor | null>;
  crear(datos: DatosCrearProveedor): Promise<Proveedor>;
  actualizar(id: number, cambios: DatosActualizarProveedor): Promise<Proveedor>;
  cambiarEstado(id: number, isActive: boolean): Promise<Proveedor>;
}
