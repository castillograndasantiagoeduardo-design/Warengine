/**
 * permisos.ts — Mapa acción de la UI → permiso que exige su ruta en el backend.
 *
 * Única fuente para guards de página, menú y botones del panel de administración.
 * Debe coincidir con Backend/apps/api/src/routes/administracion.routes.ts y
 * autenticacion.routes.ts: si una ruta cambia de permiso, se cambia aquí.
 */

import { PERMISSIONS } from '@warengine/contracts';

export const PERMISOS_ADMIN = {
  // Dashboard
  /** GET /dashboard/metricas | rendimiento | ranking | inventario | resumen */
  verMetricasGlobales: PERMISSIONS.ADMIN_VER_METRICAS_GLOBALES,
  /** GET /dashboard/tendencias */
  verTendencias: PERMISSIONS.ADMIN_VER_METRICAS_SUCURSAL,

  // Sucursales y áreas (el backend usa el mismo permiso para ambas)
  /** GET/POST /sucursales, PUT /sucursales/:id(/estado), GET /sucursales/:id/detalle, CRUD de áreas */
  gestionarSucursales: PERMISSIONS.ADMIN_GESTIONAR_SUCURSALES,

  // Personal
  /** GET /empleados, GET/PUT /empleados/:id */
  gestionarPersonal: PERMISSIONS.ADMIN_GESTIONAR_PERSONAL,
  /** GET/POST /empleados/:id/salarios */
  gestionarSalarios: PERMISSIONS.ADMIN_GESTIONAR_SALARIOS,

  // Usuarios
  /** GET/POST /usuarios, PUT /usuarios/:id/estado | password | sucursales, GET /usuarios/:id/sucursales */
  gestionarUsuarios: PERMISSIONS.AUTH_MANAGE_USERS,
  /** PUT /usuarios/:id/rol, GET /roles */
  asignarRoles: PERMISSIONS.AUTH_ASSIGN_ROLES,

  // Auditoría y alertas
  /** GET /auditoria, GET /auditoria/exportar */
  verAuditoria: PERMISSIONS.AUTH_VIEW_AUDIT,
  /** GET /alertas-stock, GET/POST /alertas, PUT /alertas/:id/estado */
  gestionarAlertas: PERMISSIONS.ADMIN_GESTIONAR_ALERTAS,
} as const;
