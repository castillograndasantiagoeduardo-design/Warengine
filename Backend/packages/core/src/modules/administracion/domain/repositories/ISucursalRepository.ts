import { Sucursal } from '../entities/Sucursal.ts';
import { SucursalDetalle } from '../entities/SucursalDetalle.ts';

export interface DatosSucursal {
  nombre: string;
  direccion?: string | null;
  contacto?: string | null;
}

export interface ISucursalRepository {
  listar(): Promise<Sucursal[]>;
  findById(id: number): Promise<Sucursal | null>;
  findByNombre(nombre: string): Promise<Sucursal | null>;
  crear(datos: DatosSucursal): Promise<Sucursal>;
  actualizar(
    id: number,
    cambios: Partial<DatosSucursal> & { isActive?: boolean },
  ): Promise<Sucursal>;
  contarUsuariosActivos?(sucursalId: number): Promise<number>;
  obtenerDetalle?(id: number): Promise<SucursalDetalle | null>;
}

