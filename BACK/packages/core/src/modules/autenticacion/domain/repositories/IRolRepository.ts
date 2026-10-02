export interface IRolRepository {
  /**
   * Retorna una lista de códigos de permisos (ej. 'facturacion:facturar')
   * asociados a un rol específico.
   */
  obtenerPermisosDeRol(rolId: number): Promise<string[]>;
}
