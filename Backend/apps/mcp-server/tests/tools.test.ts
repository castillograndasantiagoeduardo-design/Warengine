import { assertEquals, assertObjectMatch } from 'jsr:@std/assert@^1';
import { Result } from '@warengine/shared-kernel';
import { PERMISSIONS, TOOL_NAMES } from '@warengine/contracts';
import type { AppContainer } from '@warengine/composition';
import type { McpSessionContext } from '../src/session/index.ts';
import { McpAuthorizationGateway } from '../src/gateway/index.ts';
import {
  inicializarCatalogoTools,
  obtenerCatalogoCompleto,
  obtenerToolsAutorizadasParaUsuario,
  consultaStockTool,
  stockBajoTool,
  ventasPeriodoTool,
  estadoFacturaTool,
  metricasGlobalesTool,
  consultaActivoTool,
  crearProductoTool,
  ajustarStockTool,
} from '../src/index.ts';

// ─── Fixtures y Mocks ────────────────────────────────────────────────────────

function crearMockContainer(overrides: Partial<AppContainer> = {}) {
  const logsRegistrados: any[] = [];

  const defaultMock: any = {
    mcp: {
      registrarLog: {
        execute: (log: any) => {
          logsRegistrados.push(log);
          return Promise.resolve(Result.ok(undefined));
        },
      },
    },
    inventario: {
      listarProductos: {
        execute: (_req: any) =>
          Promise.resolve(
            Result.ok({
              items: [
                {
                  id: 'prod-uuid-1',
                  sku: 'LAP-001',
                  nombre: 'Laptop Pro 15',
                  precioVenta: 1200,
                  precioCompra: 900,
                  isActive: true,
                },
              ],
              total: 1,
              page: 1,
              limit: 10,
              totalPages: 1,
            }),
          ),
      },
      consultarStockSucursal: {
        execute: (_req: any) =>
          Promise.resolve(
            Result.ok({
              productoId: 'prod-uuid-1',
              nombreProducto: 'Laptop Pro 15',
              sku: 'LAP-001',
              sucursalId: 1,
              nombreSucursal: 'Sede Principal',
              stockActual: 15,
              stockMinimo: 5,
              alertaAbastecimiento: false,
            }),
          ),
      },
      crearProducto: {
        execute: (req: any) =>
          Promise.resolve(
            Result.ok({
              id: 'prod-uuid-nuevo',
              sku: req.sku,
              nombre: req.nombre,
              precioVenta: req.precioVenta,
              precioCompra: req.precioCompra,
              categoriaId: req.categoriaId,
              proveedorId: req.proveedorId,
              isActive: true,
            }),
          ),
      },
      ajustarInventario: {
        execute: (req: any) =>
          Promise.resolve(
            Result.ok({
              mensaje: 'Ajuste de inventario registrado.',
              ajusteRealizado: true,
              movimientoId: 'mov-uuid-1',
              productoId: req.productoId,
              sucursalId: req.sucursalId,
              stockPrevio: 15,
              stockFisico: req.stockFisico,
              diferencia: req.stockFisico - 15,
              tipoAjuste: req.stockFisico > 15 ? 'ajuste_entrada' : 'ajuste_salida',
            }),
          ),
      },
    },
    administracion: {
      consultarAlertasStock: {
        execute: (_req: any) =>
          Promise.resolve(
            Result.ok({
              items: [
                {
                  productoId: 'prod-uuid-critico',
                  sku: 'RAT-002',
                  nombre: 'Mouse Inalámbrico',
                  sucursalId: 1,
                  sucursalNombre: 'Sede Principal',
                  stockActual: 2,
                  stockMinimo: 10,
                  faltante: 8,
                },
              ],
              total: 1,
              page: 1,
              limit: 20,
              totalPages: 1,
            }),
          ),
      },
      consultarMetricasGanancias: {
        execute: (_req: any) =>
          Promise.resolve(
            Result.ok({
              ingresosTotales: 50000,
              costoTotal: 30000,
              gananciaNeta: 20000,
              margenPorcentaje: 40,
              totalFacturas: 120,
              ticketPromedio: 416.66,
            }),
          ),
      },
      consultarRendimientoSucursales: {
        execute: (_req: any) =>
          Promise.resolve(
            Result.ok([
              {
                sucursalId: 1,
                nombreSucursal: 'Sede Principal',
                totalVentas: 35000,
                totalFacturas: 80,
                ticketPromedio: 437.5,
                gananciaNeta: 14000,
              },
            ]),
          ),
      },
    },
    facturacion: {
      obtenerFacturaPorId: {
        execute: (req: any) =>
          Promise.resolve(
            Result.ok({
              id: req.id,
              consecutivo: 1001,
              sucursalId: 1,
              clienteId: 'cli-001',
              fecha: new Date('2026-10-20T10:00:00Z'),
              estado: 'emitida',
              subtotal: 100,
              iva: 19,
              total: 119,
              items: [
                {
                  productoId: 'prod-uuid-1',
                  cantidad: 1,
                  precioUnitario: 100,
                  subtotal: 100,
                },
              ],
              pagos: [{ medioPago: 'tarjeta' }],
            }),
          ),
      },
      listarFacturas: {
        execute: (_req: any) =>
          Promise.resolve(
            Result.ok([
              {
                id: 'fac-uuid-1',
                consecutivo: 1001,
                sucursalId: 1,
                clienteId: 'cli-001',
                fecha: new Date('2026-10-20T10:00:00Z'),
                estado: 'emitida',
                subtotal: 100,
                iva: 19,
                total: 119,
                items: [],
                pagos: [{ medioPago: 'efectivo' }],
              },
            ]),
          ),
      },
    },
    _logs: logsRegistrados,
  };

  return { ...defaultMock, ...overrides } as unknown as AppContainer & { _logs: any[] };
}

function crearSesionUsuario(
  permisos: string[] = [PERMISSIONS.MCP_CONSULTAR],
  esGlobal = false,
  sucursalId = 1,
): McpSessionContext {
  const usuarioId = '11111111-1111-1111-1111-111111111111';
  return {
    usuarioId,
    rolId: 1,
    sucursalId,
    sucursalesPermitidas: [sucursalId],
    esGlobal,
    permisos,
    sessionId: 'session-test-id',
    actor: {
      usuarioId,
      ip: null,
      permisos,
    },
    createdAt: new Date(),
  };
}

// ─── 1. Pruebas de Registro del Catálogo Global ──────────────────────────────

Deno.test('Catálogo MCP: registra todas las Tools y filtra según permisos del usuario', () => {
  inicializarCatalogoTools();
  const catalogo = obtenerCatalogoCompleto();

  // Deben estar registradas al menos las 8 tools oficiales
  assertEquals(catalogo.length >= 8, true);

  // Usuario cajero solo con mcp:consultar
  const sesionCajero = crearSesionUsuario([PERMISSIONS.MCP_CONSULTAR]);
  const toolsCajero = obtenerToolsAutorizadasParaUsuario(sesionCajero);

  // El cajero no debe ver ni crear-producto ni ajustar-stock ni metricas-globales
  const nombresCajero = toolsCajero.map((t) => t.name);
  assertEquals(nombresCajero.includes(TOOL_NAMES.CONSULTA_STOCK), true);
  assertEquals(nombresCajero.includes(TOOL_NAMES.STOCK_BAJO), true);
  assertEquals(nombresCajero.includes(TOOL_NAMES.VENTAS_PERIODO), true);
  assertEquals(nombresCajero.includes(TOOL_NAMES.CREAR_PRODUCTO), false);
  assertEquals(nombresCajero.includes(TOOL_NAMES.AJUSTAR_STOCK), false);
  assertEquals(nombresCajero.includes(TOOL_NAMES.METRICAS_GLOBALES), false);

  // SuperAdmin con todos los permisos debe ver todas las herramientas
  const sesionSuperAdmin = crearSesionUsuario(Object.values(PERMISSIONS), true);
  const toolsAdmin = obtenerToolsAutorizadasParaUsuario(sesionSuperAdmin);
  assertEquals(toolsAdmin.length, catalogo.length);
});

// ─── 2. Pruebas de Tools de Lectura (Fase 4) ──────────────────────────────────

Deno.test('Tool consulta-stock: retorna existencias de producto encontrado y formatea markdown', async () => {
  const container = crearMockContainer();
  const session = crearSesionUsuario([PERMISSIONS.MCP_CONSULTAR]);

  const respuesta = await McpAuthorizationGateway.procesarTool({
    toolName: TOOL_NAMES.CONSULTA_STOCK,
    permisoRequerido: PERMISSIONS.MCP_CONSULTAR,
    schema: consultaStockTool.schema,
    args: { sku: 'LAP-001' },
    sessionContext: session,
    container,
    handler: (argsValidados, ctx) => consultaStockTool.handler(argsValidados, container, ctx),
    formateador: consultaStockTool.formateador,
  });

  assertEquals(Boolean(respuesta.isError), false);
  assertEquals(respuesta.content[0].text.includes('Consulta de Existencias e Inventario'), true);
  assertEquals(respuesta.content[0].text.includes('LAP-001'), true);
  assertEquals(respuesta.content[0].text.includes('15 unidades'), true);
});

Deno.test('Tool stock-bajo: retorna reporte de artículos por debajo del stock mínimo', async () => {
  const container = crearMockContainer();
  const session = crearSesionUsuario([PERMISSIONS.MCP_CONSULTAR]);

  const respuesta = await McpAuthorizationGateway.procesarTool({
    toolName: TOOL_NAMES.STOCK_BAJO,
    permisoRequerido: PERMISSIONS.MCP_CONSULTAR,
    schema: stockBajoTool.schema,
    args: { limite: 10 },
    sessionContext: session,
    container,
    handler: (argsValidados, ctx) => stockBajoTool.handler(argsValidados, container, ctx),
    formateador: stockBajoTool.formateador,
  });

  assertEquals(Boolean(respuesta.isError), false);
  assertEquals(respuesta.content[0].text.includes('Reporte de Stock Crítico'), true);
  assertEquals(respuesta.content[0].text.includes('Mouse Inalámbrico'), true);
  assertEquals(respuesta.content[0].text.includes('**Faltante para Nivel Óptimo:** 8 unidades'), true);
});

Deno.test('Tool ventas-periodo: oculta costos financieros si el usuario no tiene permiso sensible (RF-SA-I3)', async () => {
  const container = crearMockContainer();
  // Sesión con mcp:consultar pero SIN mcp:herramientas-financieras
  const session = crearSesionUsuario([PERMISSIONS.MCP_CONSULTAR]);

  const respuesta = await McpAuthorizationGateway.procesarTool({
    toolName: TOOL_NAMES.VENTAS_PERIODO,
    permisoRequerido: PERMISSIONS.MCP_CONSULTAR,
    schema: ventasPeriodoTool.schema,
    args: { periodo: 'hoy' },
    sessionContext: session,
    container,
    handler: (argsValidados, ctx) => ventasPeriodoTool.handler(argsValidados, container, ctx),
    formateador: ventasPeriodoTool.formateador,
  });

  assertEquals(Boolean(respuesta.isError), false);
  assertEquals(respuesta.content[0].text.includes('Resumen de Ventas e Ingresos'), true);
  assertEquals(respuesta.content[0].text.includes('**Facturas Emitidas:** 120'), true);
  // NO debe contener desglose sensible
  assertEquals(respuesta.content[0].text.includes('Desglose Financiero Corporativo'), false);
  assertEquals(respuesta.content[0].text.includes('Ganancia Neta'), false);
});

Deno.test('Tool ventas-periodo: expone costos y ganancias si el usuario posee mcp:herramientas-financieras', async () => {
  const container = crearMockContainer();
  // Sesión autorizada para ver métricas financieras
  const session = crearSesionUsuario([PERMISSIONS.MCP_CONSULTAR, PERMISSIONS.MCP_HERRAMIENTAS_FINANCIERAS]);

  const respuesta = await McpAuthorizationGateway.procesarTool({
    toolName: TOOL_NAMES.VENTAS_PERIODO,
    permisoRequerido: PERMISSIONS.MCP_CONSULTAR,
    schema: ventasPeriodoTool.schema,
    args: { periodo: 'mes' },
    sessionContext: session,
    container,
    handler: (argsValidados, ctx) => ventasPeriodoTool.handler(argsValidados, container, ctx),
    formateador: ventasPeriodoTool.formateador,
  });

  assertEquals(Boolean(respuesta.isError), false);
  assertEquals(respuesta.content[0].text.includes('Desglose Financiero Corporativo (Autorizado)'), true);
  assertEquals(respuesta.content[0].text.includes('Ganancia Neta'), true);
  assertEquals(respuesta.content[0].text.includes('40.00%'), true);
});

Deno.test('Tool estado-factura: consulta factura por consecutivo o UUID y lista items', async () => {
  const container = crearMockContainer();
  const session = crearSesionUsuario([PERMISSIONS.FACTURACION_CONSULTAR]);

  const respuesta = await McpAuthorizationGateway.procesarTool({
    toolName: TOOL_NAMES.ESTADO_FACTURA,
    permisoRequerido: PERMISSIONS.FACTURACION_CONSULTAR,
    schema: estadoFacturaTool.schema,
    args: { facturaId: 1001 },
    sessionContext: session,
    container,
    handler: (argsValidados, ctx) => estadoFacturaTool.handler(argsValidados, container, ctx),
    formateador: estadoFacturaTool.formateador,
  });

  assertEquals(Boolean(respuesta.isError), false);
  assertEquals(respuesta.content[0].text.includes('Factura Electrónica #1001'), true);
  assertEquals(respuesta.content[0].text.includes('EMITIDA / VÁLIDA'), true);
  assertEquals(respuesta.content[0].text.includes('**TOTAL:** $119.00'), true);
});

Deno.test('Tool metricas-globales: provee reporte corporativo global al SuperAdmin', async () => {
  const container = crearMockContainer();
  const session = crearSesionUsuario([PERMISSIONS.MCP_HERRAMIENTAS_FINANCIERAS], true);

  const respuesta = await McpAuthorizationGateway.procesarTool({
    toolName: TOOL_NAMES.METRICAS_GLOBALES,
    permisoRequerido: PERMISSIONS.MCP_HERRAMIENTAS_FINANCIERAS,
    schema: metricasGlobalesTool.schema,
    args: { periodo: 'mes' },
    sessionContext: session,
    container,
    handler: (argsValidados, ctx) => metricasGlobalesTool.handler(argsValidados, container, ctx),
    formateador: metricasGlobalesTool.formateador,
  });

  assertEquals(Boolean(respuesta.isError), false);
  assertEquals(respuesta.content[0].text.includes('Informe Ejecutivo Financiero Consolidado'), true);
  assertEquals(respuesta.content[0].text.includes('Ganancia Neta Consolidada'), true);
  assertEquals(respuesta.content[0].text.includes('Rendimiento por Sede Operativa'), true);
});

Deno.test('Tool consulta-activo: responde de manera estructurada conforme a RF-LOG-C4', async () => {
  const container = crearMockContainer();
  const session = crearSesionUsuario([PERMISSIONS.LOGISTICA_LEER]);

  const respuesta = await McpAuthorizationGateway.procesarTool({
    toolName: TOOL_NAMES.CONSULTA_ACTIVO,
    permisoRequerido: PERMISSIONS.LOGISTICA_LEER,
    schema: consultaActivoTool.schema,
    args: { codigoInterno: 'ACT-001' },
    sessionContext: session,
    container,
    handler: (argsValidados, ctx) => consultaActivoTool.handler(argsValidados, container, ctx),
    formateador: consultaActivoTool.formateador,
  });

  assertEquals(Boolean(respuesta.isError), false);
  assertEquals(respuesta.content[0].text.includes('Consulta de Activos Fijos (Logística)'), true);
});

// ─── 3. Pruebas de Tools de Mutación (Fase 5) ─────────────────────────────────

Deno.test('Tool crear-producto: crea nuevo artículo en catálogo maestro y audita', async () => {
  const container = crearMockContainer();
  const session = crearSesionUsuario([PERMISSIONS.INVENTARIO_ESCRIBIR], true);

  const respuesta = await McpAuthorizationGateway.procesarTool({
    toolName: TOOL_NAMES.CREAR_PRODUCTO,
    permisoRequerido: PERMISSIONS.INVENTARIO_ESCRIBIR,
    schema: crearProductoTool.schema,
    args: {
      sku: 'MON-4K',
      nombre: 'Monitor 4K UltraHD',
      precioVenta: 450,
      precioCompra: 300,
      categoriaId: 1,
      proveedorId: 1,
    },
    sessionContext: session,
    container,
    handler: (argsValidados, ctx) => crearProductoTool.handler(argsValidados, container, ctx),
    formateador: crearProductoTool.formateador,
  });

  assertEquals(Boolean(respuesta.isError), false);
  assertEquals(respuesta.content[0].text.includes('Producto Creado Exitosamente'), true);
  assertEquals(respuesta.content[0].text.includes('MON-4K'), true);
  assertEquals(respuesta.content[0].text.includes('Monitor 4K UltraHD'), true);
  assertEquals(respuesta.content[0].text.includes('$450.00'), true);
});

Deno.test('Tool ajustar-stock: procesa ajuste justificado y concilia stock físico', async () => {
  const container = crearMockContainer();
  const session = crearSesionUsuario([PERMISSIONS.INVENTARIO_AJUSTAR_STOCK], true);

  const respuesta = await McpAuthorizationGateway.procesarTool({
    toolName: TOOL_NAMES.AJUSTAR_STOCK,
    permisoRequerido: PERMISSIONS.INVENTARIO_AJUSTAR_STOCK,
    schema: ajustarStockTool.schema,
    args: {
      sku: 'LAP-001',
      sucursalId: 1,
      cantidad: 5,
      tipo: 'ajuste_entrada',
      motivo: 'Conteo físico anual arrojó 5 unidades sobrantes no registradas.',
    },
    sessionContext: session,
    container,
    handler: (argsValidados, ctx) => ajustarStockTool.handler(argsValidados, container, ctx),
    formateador: ajustarStockTool.formateador,
  });

  assertEquals(Boolean(respuesta.isError), false);
  assertEquals(respuesta.content[0].text.includes('Ajuste de Inventario Procesado con Éxito'), true);
  assertEquals(respuesta.content[0].text.includes('**Nuevo Stock Físico Conciliado:** 20 unidades'), true);
  assertEquals(respuesta.content[0].text.includes('+5 unidades'), true);
});

Deno.test('Tool ajustar-stock: falla con error de dominio si salida supera stock actual', async () => {
  const container = crearMockContainer();
  const session = crearSesionUsuario([PERMISSIONS.INVENTARIO_AJUSTAR_STOCK], true);

  // Stock actual en mock es 15, intentamos dar salida a 50
  const respuesta = await McpAuthorizationGateway.procesarTool({
    toolName: TOOL_NAMES.AJUSTAR_STOCK,
    permisoRequerido: PERMISSIONS.INVENTARIO_AJUSTAR_STOCK,
    schema: ajustarStockTool.schema,
    args: {
      sku: 'LAP-001',
      sucursalId: 1,
      cantidad: 50,
      tipo: 'ajuste_salida',
      motivo: 'Merma total reportada por avería en bodega.',
    },
    sessionContext: session,
    container,
    handler: (argsValidados, ctx) => ajustarStockTool.handler(argsValidados, container, ctx),
    formateador: ajustarStockTool.formateador,
  });

  assertEquals(respuesta.isError, true);
  assertEquals(respuesta.content[0].text.includes('insuficiente'), true);
});
