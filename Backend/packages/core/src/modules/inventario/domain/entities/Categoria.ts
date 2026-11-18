export class Categoria {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
    public readonly isActive: boolean,
    public readonly totalProductos?: number,
  ) {}

  public activar(): Categoria {
    return new Categoria(this.id, this.nombre, true, this.totalProductos);
  }

  public inactivar(): Categoria {
    return new Categoria(this.id, this.nombre, false, this.totalProductos);
  }
}
