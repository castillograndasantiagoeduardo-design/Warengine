export interface IRolRepository {
  /**
   * Retorna una lista de códigos de permisos (ej. 'facturacion:facturar')
   * asociados a un rol específico.
   */
  obtenerPermisosDeRol(rolId: number): Promise<string[]>;

  /**
   * Retorna el nombre del rol a partir de su ID (ej. 'super-admin')
   */
  obtenerNombreDeRol?(rolId: number): Promise<string | null>;
}


