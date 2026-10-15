/**
 * Producto — Entidad de dominio inmutable que representa un producto vendible o almacenable.
 * Mapea los campos reales de la tabla `productos` en MySQL.
 */
export class Producto {
  public readonly advertencia?: string | null;

  constructor(
    public readonly id: string,
    public readonly sku: string,
    public readonly nombre: string,
    public readonly categoriaId: number | null,
    public readonly proveedorId: number | null,
    public readonly precioCompra: number,
    public readonly precioVenta: number,
    public readonly precioCorporativo: number | null,
    public readonly precioCorporativoActualizadoEn: Date | null,
    public readonly isActive: boolean = true,
    advertencia?: string | null,
  ) {
    this.advertencia =
      advertencia !== undefined
        ? advertencia
        : precioVenta < precioCompra
        ? `Advertencia (RF-ADM-B13): El precio de venta ($${precioVenta}) es inferior al precio de compra ($${precioCompra}). Margen negativo detectado.`
        : null;
  }

  /**
   * Indica si el precio de venta es menor al costo de adquisición (RF-ADM-B13).
   */
  public get tieneMargenNegativo(): boolean {
    return this.precioVenta < this.precioCompra;
  }

  public activar(): Producto {
    return new Producto(
      this.id,
      this.sku,
      this.nombre,
      this.categoriaId,
      this.proveedorId,
      this.precioCompra,
      this.precioVenta,
      this.precioCorporativo,
      this.precioCorporativoActualizadoEn,
      true,
      this.advertencia,
    );
  }

  public inactivar(): Producto {
    return new Producto(
      this.id,
      this.sku,
      this.nombre,
      this.categoriaId,
      this.proveedorId,
      this.precioCompra,
      this.precioVenta,
      this.precioCorporativo,
      this.precioCorporativoActualizadoEn,
      false,
      this.advertencia,
    );
  }
}
