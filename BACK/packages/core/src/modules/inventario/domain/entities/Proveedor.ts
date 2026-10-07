export class Proveedor {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
    public readonly contacto: string | null,
    public readonly isActive: boolean,
  ) {}

  public activar(): Proveedor {
    return new Proveedor(this.id, this.nombre, this.contacto, true);
  }

  public inactivar(): Proveedor {
    return new Proveedor(this.id, this.nombre, this.contacto, false);
  }

  // Punto de extensión para la relación con productos (etapa de productos - RF-ADM-B6)
  // public readonly productosAsociados?: Producto[];
}
