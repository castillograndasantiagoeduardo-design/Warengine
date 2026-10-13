/** Un producto con stock agotado o por debajo del mínimo en una sucursal (RF-ADM-A6). */
export class AlertaStock {
  /** Unidades que faltan para llegar al mínimo (0 si ya lo alcanza justo). */
  public readonly faltante: number;

  constructor(
    public readonly productoId: string,
    public readonly sku: string,
    public readonly nombre: string,
    public readonly sucursalId: number,
    public readonly sucursalNombre: string,
    public readonly stockActual: number,
    public readonly stockMinimo: number,
  ) {
    this.faltante = Math.max(0, stockMinimo - stockActual);
  }
}