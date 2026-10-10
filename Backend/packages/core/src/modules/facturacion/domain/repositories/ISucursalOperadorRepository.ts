export interface ISucursalOperadorRepository {
    /** Sucursal donde trabaja el usuario (empleado vinculado), o null si no se encuentra. */
    obtenerSucursalId(usuarioId: string): Promise<number | null>;
}