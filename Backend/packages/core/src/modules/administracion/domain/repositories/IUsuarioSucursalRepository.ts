/**
 * Asignación de sucursales de un usuario (RF-ADM-C10).
 * Sucursal principal = empleados.sucursal_id. Sucursales adicionales = tabla usuario_sucursales.
 * Las sucursales autorizadas de un usuario son la principal MÁS las adicionales.
 */
export interface IUsuarioSucursalRepository {
  /** Ids de las sucursales adicionales del usuario, ordenados de menor a mayor. */
  obtenerIdsAdicionales(usuarioId: string): Promise<number[]>;

  /**
   * Reemplaza la sucursal principal y todas las adicionales en una sola transacción,
   * invalidando los tokens y refresh tokens vigentes del usuario.
   */
  reemplazarSucursales(
    usuarioId: string,
    sucursalPrincipalId: number,
    sucursalesAdicionalesIds: number[],
    invalidarTokensEn: Date,
  ): Promise<void>;
}