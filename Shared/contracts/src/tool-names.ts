// Nombres de las Tools expuestas por el servidor MCP de Warengine.
// Úsalos como identificadores únicos en el catálogo y en el gateway.

export const TOOL_NAMES = {
  // Inventario
  CONSULTA_STOCK: 'consulta-stock',
  STOCK_BAJO: 'stock-bajo',

  // Facturación
  VENTAS_PERIODO: 'ventas-periodo',
  ESTADO_FACTURA: 'estado-factura',

  // Administración (solo super-admin)
  METRICAS_GLOBALES: 'metricas-globales',

  // Logística
  CONSULTA_ACTIVO: 'consulta-activo',
} as const;

export type ToolName = (typeof TOOL_NAMES)[keyof typeof TOOL_NAMES];
