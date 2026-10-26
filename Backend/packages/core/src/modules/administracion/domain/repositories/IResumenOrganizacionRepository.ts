/**
 * Conteos globales de la organización para el resumen del Super Admin (RF-ADM-A1, RF-SA-I3).
 *
 * Se separa de IMetricasAdminRepository para no obligar a sus implementaciones
 * (y dobles de prueba) a exponer conteos que solo usa el resumen global.
 */
export interface ResumenOrganizacion {
  totalSucursales: number;
  sucursalesActivas: number;
  usuariosTotales: number;
  usuariosActivos: number;
}

export interface IResumenOrganizacionRepository {
  obtenerResumenOrganizacion(): Promise<ResumenOrganizacion>;
}
