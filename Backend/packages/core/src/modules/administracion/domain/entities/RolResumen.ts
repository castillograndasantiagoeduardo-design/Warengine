/**
 * RolResumen.ts
 *
 * Vista de catálogo de un rol del sistema (id, nombre y descripción),
 * usada por el selector de cambio de rol del Super Admin (RF-ADM-C7).
 */
export class RolResumen {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
    public readonly descripcion: string | null,
  ) {}
}
