// Constantes de permisos del sistema Warengine.
// Deben coincidir con los valores de la columna `codigo` en la tabla `permisos` de la BD (seed).
// El campo `codigo` usa COLLATE utf8mb4_bin → comparación exacta, sensible a mayúsculas.

export const PERMISSIONS = {
  // Autenticación
  AUTH_MANAGE_USERS: 'autenticacion:gestionar-usuarios',
  AUTH_ASSIGN_ROLES: 'autenticacion:asignar-roles',
  AUTH_VIEW_AUDIT: 'autenticacion:ver-auditoria',

  // Inventario
  INVENTARIO_LEER: 'inventario:leer',
  INVENTARIO_ESCRIBIR: 'inventario:escribir',
  INVENTARIO_REGISTRAR_MOVIMIENTO: 'inventario:registrar-movimiento',
  INVENTARIO_AJUSTAR_STOCK: 'inventario:ajustar-stock',
  INVENTARIO_VER_KARDEX: 'inventario:ver-kardex',

  // Facturación
  FACTURACION_FACTURAR: 'facturacion:facturar',
  FACTURACION_ANULAR: 'facturacion:anular',
  FACTURACION_DEVOLUCION: 'facturacion:devolucion',
  FACTURACION_CONSULTAR: 'facturacion:consultar',
  FACTURACION_GESTIONAR_CLIENTES: 'facturacion:gestionar-clientes',

  // Administración
  ADMIN_GESTIONAR_SUCURSALES: 'administracion:gestionar-sucursales',
  ADMIN_GESTIONAR_PERSONAL: 'administracion:gestionar-personal',
  ADMIN_GESTIONAR_SALARIOS: 'administracion:gestionar-salarios',
  ADMIN_VER_METRICAS_SUCURSAL: 'administracion:ver-metricas-sucursal',
  ADMIN_VER_METRICAS_GLOBALES: 'administracion:ver-metricas-globales',
  ADMIN_GESTIONAR_ALERTAS: 'administracion:gestionar-alertas',

  // Logística
  LOGISTICA_LEER: 'logistica:leer',
  LOGISTICA_GESTIONAR_ACTIVOS: 'logistica:gestionar-activos',
  LOGISTICA_ASIGNAR_ACTIVOS: 'logistica:asignar-activos',
  LOGISTICA_MANTENIMIENTO: 'logistica:mantenimiento',

  // MCP
  MCP_CONSULTAR: 'mcp:consultar',
  MCP_EJECUTAR_HERRAMIENTAS: 'mcp:ejecutar-herramientas',
  MCP_HERRAMIENTAS_FINANCIERAS: 'mcp:herramientas-financieras',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
