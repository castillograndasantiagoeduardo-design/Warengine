/** Datos de presentación de la sesión: quién es el usuario y en qué sede trabaja. */
export interface PerfilSesion {
  nombre: string | null;
  /** Sucursal principal del empleado vinculado (empleados.sucursal_id); null si no tiene. */
  sucursalId: number | null;
  sucursalNombre: string | null;
}

export interface IPerfilSesionRepository {
  /** Perfil del usuario para la sesión, o null si el usuario no existe. */
  obtenerPerfil(usuarioId: string): Promise<PerfilSesion | null>;
}
