import { RolResumen } from '../entities/RolResumen.ts';

/**
 * Puerto de solo lectura sobre el catálogo de roles.
 *
 * Se separa de IRolRepository (autenticación) para no obligar a sus
 * implementaciones a exponer el listado completo.
 */
export interface IRolCatalogoRepository {
  /** Todos los roles registrados, ordenados por id. */
  listarRoles(): Promise<RolResumen[]>;
}
