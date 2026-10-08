export class Categoria {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
    public readonly isActive: boolean,
  ) {}

  public activar(): Categoria {
    return new Categoria(this.id, this.nombre, true);
  }

  public inactivar(): Categoria {
    return new Categoria(this.id, this.nombre, false);
  }
}
