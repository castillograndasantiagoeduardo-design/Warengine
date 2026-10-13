/**
 * Alcance de sucursales de un usuario (RNF-ADM-04):
 *  - global: puede ver y operar datos de todas las sucursales (permiso de métricas globales).
 *  - limitado: solo las sucursales que tiene asignadas (principal + adicionales).
 * Se resuelve en el servidor a partir de la BD; nunca se confía en un id enviado por el cliente.
 */
export class AlcanceSucursal {
  private constructor(
    public readonly esGlobal: boolean,
    private readonly ids: readonly number[],
  ) {}

  static global(): AlcanceSucursal {
    return new AlcanceSucursal(true, []);
  }

  static limitado(sucursalIds: number[]): AlcanceSucursal {
    return new AlcanceSucursal(false, [...new Set(sucursalIds)].sort((a, b) => a - b));
  }

  public permite(sucursalId: number): boolean {
    return this.esGlobal || this.ids.includes(sucursalId);
  }

  /** Sucursales a las que debe acotarse una consulta. `undefined` = sin restricción (global). */
  public sucursalesPermitidas(): number[] | undefined {
    return this.esGlobal ? undefined : [...this.ids];
  }
}