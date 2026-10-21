import { registrarToolEnCatalogo } from '../catalog/catalog-registry.ts';
import { consultaStockTool } from './inventario/consulta-stock.tool.ts';
import { stockBajoTool } from './inventario/stock-bajo.tool.ts';
import { crearProductoTool } from './inventario/crear-producto.tool.ts';
import { ajustarStockTool } from './inventario/ajustar-stock.tool.ts';
import { ventasPeriodoTool } from './facturacion/ventas-periodo.tool.ts';
import { estadoFacturaTool } from './facturacion/estado-factura.tool.ts';
import { metricasGlobalesTool } from './administracion/metricas-globales.tool.ts';
import { consultaActivoTool } from './logistica/consulta-activo.tool.ts';

export * from './inventario/consulta-stock.tool.ts';
export * from './inventario/stock-bajo.tool.ts';
export * from './inventario/crear-producto.tool.ts';
export * from './inventario/ajustar-stock.tool.ts';
export * from './facturacion/ventas-periodo.tool.ts';
export * from './facturacion/estado-factura.tool.ts';
export * from './administracion/metricas-globales.tool.ts';
export * from './logistica/consulta-activo.tool.ts';

/**
 * Registra todas las herramientas oficiales de Warengine en el catálogo global del servidor MCP.
 * Debe invocarse una sola vez durante el arranque del proceso o en suites de pruebas.
 */
export function inicializarCatalogoTools(): void {
  // ── 1. Herramientas de Consulta y Lectura (Fase 4) ──────────────────────────
  registrarToolEnCatalogo(consultaStockTool);
  registrarToolEnCatalogo(stockBajoTool);
  registrarToolEnCatalogo(ventasPeriodoTool);
  registrarToolEnCatalogo(estadoFacturaTool);
  registrarToolEnCatalogo(metricasGlobalesTool);
  registrarToolEnCatalogo(consultaActivoTool);

  // ── 2. Herramientas de Escritura y Mutación (Fase 5) ────────────────────────
  registrarToolEnCatalogo(crearProductoTool);
  registrarToolEnCatalogo(ajustarStockTool);
}
