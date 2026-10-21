export const ESTADOS_ASIGNACION = {
  ACTIVA: 'activa',
  DEVUELTA: 'devuelta',
  VENCIDA: 'vencida',
} as const;

export type EstadoAsignacion = (typeof ESTADOS_ASIGNACION)[keyof typeof ESTADOS_ASIGNACION];

export class AsignacionActivo {
  constructor(
    public readonly id: string,
    public readonly activoId: string,
    public readonly empleadoId: string | null,
    public readonly empleadoNombre: string | null,
    public readonly areaId: number | null,
    public readonly areaNombre: string | null,
    public readonly sucursalId: number,
    public readonly asignadoPor: string,
    public readonly fechaAsignacion: Date,
    public readonly fechaDevolucionEsperada: Date | null,
    public readonly fechaDevolucionReal: Date | null,
    public readonly estado: EstadoAsignacion,
    public readonly observaciones: string | null,
  ) {}

  public get estaVigente(): boolean {
    return this.fechaDevolucionReal === null && this.estado !== ESTADOS_ASIGNACION.DEVUELTA;
  }
}
