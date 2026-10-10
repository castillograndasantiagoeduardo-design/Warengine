/**
 * Producto — Entidad de dominio inmutable que representa un producto vendible o almacenable.
 * Mapea los campos reales de la tabla `productos` en MySQL.
 */
export class Producto {
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
  ) {}

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
    );
  }
}
