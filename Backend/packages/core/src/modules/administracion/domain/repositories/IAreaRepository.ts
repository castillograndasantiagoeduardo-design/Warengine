/**
 * IAreaRepository.ts
 *
 * Puerto (Port) de repositorio para la persistencia y consulta de áreas por sucursal.
 *
 * Rol en la arquitectura:
 * - Capa de Dominio (Puertos de Repositorio).
 * - Define los contratos que la capa de infraestructura (Drizzle ORM) debe satisfacer,
 *   garantizando la inversión de dependencias (DIP).
 *
 * Requisito SRS:
 * - RF-ADM-C4: Gestión de áreas por sucursal.
 */

import { Area } from '../entities/Area.ts';

export interface IAreaRepository {
  listarPorSucursal(sucursalId: number): Promise<Area[]>;
  findById(id: number): Promise<Area | null>;
  findByNombreYSucursal(nombre: string, sucursalId: number): Promise<Area | null>;
  crear(area: { nombre: string; sucursalId: number }): Promise<Area>;
  actualizar(id: number, data: { nombre: string }): Promise<Area>;
  eliminar(id: number): Promise<void>;
  contarEmpleadosEnArea(id: number): Promise<number>;
}
