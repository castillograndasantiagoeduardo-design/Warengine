export const ESTADOS_ACTIVO = {
  DISPONIBLE: 'disponible',
  ASIGNADO: 'asignado',
  MANTENIMIENTO: 'mantenimiento',
  BAJA: 'baja',
} as const;

export type EstadoActivo = (typeof ESTADOS_ACTIVO)[keyof typeof ESTADOS_ACTIVO];

export class Activo {
  constructor(
    public readonly id: string,
    public readonly codigoActivo: string,
    public readonly nombre: string,
    public readonly categoriaActivoId: number | null,
    public readonly categoriaNombre: string | null,
    public readonly sucursalId: number,
    public readonly estado: EstadoActivo,
    public readonly valorAdquisicion: number | null,
    public readonly fechaAdquisicion: string | null,
    public readonly condicion: string | null,
    public readonly isActive: boolean,
  ) {}

  public get estaDisponible(): boolean {
    return this.estado === ESTADOS_ACTIVO.DISPONIBLE;
  }

  public get estaDeBaja(): boolean {
    return this.estado === ESTADOS_ACTIVO.BAJA;
  }
}
