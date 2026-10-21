export const TIPOS_MANTENIMIENTO = {
  PREVENTIVO: 'preventivo',
  CORRECTIVO: 'correctivo',
} as const;

export type TipoMantenimiento = (typeof TIPOS_MANTENIMIENTO)[keyof typeof TIPOS_MANTENIMIENTO];

export class MantenimientoActivo {
  constructor(
    public readonly id: string,
    public readonly activoId: string,
    public readonly proveedorId: number | null,
    public readonly proveedorNombre: string | null,
    public readonly tipo: TipoMantenimiento,
    public readonly fecha: string,
    public readonly fechaFin: string | null,
    public readonly costo: number | null,
    public readonly descripcion: string | null,
  ) {}

  public get enCurso(): boolean {
    return this.fechaFin === null;
  }
}
