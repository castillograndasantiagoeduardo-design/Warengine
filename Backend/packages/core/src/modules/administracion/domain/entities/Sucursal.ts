export class Sucursal {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
    public readonly direccion: string | null,
    public readonly contacto: string | null,
    public readonly isActive: boolean,
  ) {}
}