export interface InventarioSucursalProps {
  productoId: string;
  sucursalId: number;
  stockActual: number;
  stockMinimo: number;
}

/**
 * Entidad de dominio que representa las existencias y umbral de stock mínimo
 * de un producto en una sucursal determinada (RF-ADM-B11 / RF-ADM-A3).
 */
export class InventarioSucursal {
  constructor(
    public readonly productoId: string,
    public readonly sucursalId: number,
    public readonly stockActual: number,
    public readonly stockMinimo: number,
  ) {}

  /**
   * Indica si las existencias actuales se encuentran en o por debajo del umbral mínimo,
   * lo cual activa la alerta de abastecimiento en el sistema.
   */
  public get tieneAlertaAbastecimiento(): boolean {
    return this.stockActual <= this.stockMinimo;
  }

  /**
   * Calcula el número de unidades faltantes para alcanzar el stock mínimo.
   */
  public get faltanteParaMinimo(): number {
    return Math.max(0, this.stockMinimo - this.stockActual);
  }
}
