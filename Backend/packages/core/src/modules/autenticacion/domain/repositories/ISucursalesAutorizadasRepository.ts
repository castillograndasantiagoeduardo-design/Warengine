export interface ISucursalesAutorizadasRepository {
  /**
   * Sucursales que el usuario puede operar: su sucursal principal (empleados.sucursal_id)
   * más las adicionales (usuario_sucursales), sin repetidos y ordenadas.
   */
  obtenerIdsAutorizados(usuarioId: string): Promise<number[]>;
}