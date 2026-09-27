// Constantes de permisos del sistema Warengine.
// Deben coincidir con los valores de la columna `codigo` en la tabla `permisos` de la BD.
// El campo `codigo` usa COLLATE utf8mb4_bin → comparación exacta, sensible a mayúsculas.

export const PERMISSIONS = {
  // Autenticación
  AUTH_MANAGE_USERS: 'auth:manage-users',
  AUTH_ASSIGN_ROLES: 'auth:assign-roles',
  AUTH_VIEW_AUDIT: 'auth:view-audit',

  // Inventario
  INVENTARIO_VIEW: 'inventario:view',
  INVENTARIO_MANAGE: 'inventario:manage',
  INVENTARIO_ADJUST: 'inventario:adjust',

  // Facturación / POS
  FACTURACION_EMIT: 'facturacion:emit',
  FACTURACION_VOID: 'facturacion:void',
  FACTURACION_VIEW: 'facturacion:view',

  // Administración
  ADMIN_MANAGE_BRANCHES: 'admin:manage-branches',
  ADMIN_VIEW_METRICS: 'admin:view-metrics',

  // Logística
  LOGISTICA_VIEW: 'logistica:view',
  LOGISTICA_MANAGE: 'logistica:manage',

  // MCP
  MCP_QUERY: 'mcp:query',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
