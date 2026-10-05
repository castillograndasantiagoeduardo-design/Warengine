/** Modelo de lectura para que el Super Admin gestione usuarios (nunca expone el hash). */
export class UsuarioGestionado {
  constructor(
    public readonly id: string,
    public readonly nombre: string,
    public readonly email: string,
    public readonly rolId: number,
    public readonly rolNombre: string,
    public readonly sucursalId: number,
    public readonly sucursalNombre: string,
    public readonly isActive: boolean,
  ) {}

  /** Debe coincidir con ROLES.SUPER_ADMIN de @warengine/contracts. */
  public get esSuperAdmin(): boolean {
    return this.rolNombre === 'super-admin';
  }
}