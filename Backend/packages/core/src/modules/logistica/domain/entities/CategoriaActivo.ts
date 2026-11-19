export class CategoriaActivo {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
    public readonly isActive: boolean,
    public readonly cantidadActivos: number = 0,
  ) {}
}
