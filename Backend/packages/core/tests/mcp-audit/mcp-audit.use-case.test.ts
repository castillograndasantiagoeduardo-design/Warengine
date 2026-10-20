import { assertEquals, assertObjectMatch } from 'jsr:@std/assert@^1';
import {
  ConsultarLogsMcpToolsUseCase,
  FiltrosLogsMcpTools,
  ILogMcpToolRepository,
  LogMcpTool,
  PaginaLogsMcpTools,
  RegistrarLogMcpToolUseCase,
  RegistroLogMcpTool,
} from '../../mod.ts';
import {
  ajustarStockMcpSchema,
  consultaStockMcpSchema,
  estadoFacturaMcpSchema,
  metricasGlobalesMcpSchema,
  stockBajoMcpSchema,
  ventasPeriodoMcpSchema,
} from '@warengine/contracts';

/** Mock Repository en memoria para pruebas unitarias */
class MockLogMcpToolRepository implements ILogMcpToolRepository {
  public logs: RegistroLogMcpTool[] = [];
  public debeFallar = false;

  public async registrar(registro: RegistroLogMcpTool): Promise<void> {
    if (this.debeFallar) {
      throw new Error('Error simulado de conexión a la base de datos');
    }
    this.logs.push(registro);
  }

  public async listar(filtros: FiltrosLogsMcpTools): Promise<PaginaLogsMcpTools> {
    let items = this.logs.map(
      (l, idx) =>
        new LogMcpTool({
          id: idx + 1,
          toolName: l.toolName,
          usuarioId: l.usuarioId,
          sucursalId: l.sucursalId,
          parametros: l.parametros ?? null,
          exitoso: l.exitoso,
          duracionMs: l.duracionMs,
          error: l.error,
          fecha: new Date(),
        }),
    );

    if (filtros.toolName) {
      items = items.filter((i) => i.toolName === filtros.toolName);
    }

    return {
      items: items.slice(filtros.offset, filtros.offset + filtros.limite),
      total: items.length,
    };
  }
}

// ─── Pruebas de RegistrarLogMcpToolUseCase ──────────────────────────────────────

Deno.test('RegistrarLogMcpToolUseCase: registra exitosamente una ejecución de Tool', async () => {
  const repo = new MockLogMcpToolRepository();
  const useCase = new RegistrarLogMcpToolUseCase(repo);

  const res = await useCase.execute({
    toolName: 'consulta-stock',
    usuarioId: '11111111-1111-1111-1111-111111111111',
    sucursalId: 1,
    parametros: { sku: 'PROD-001' },
    exitoso: true,
    duracionMs: 45,
    error: null,
  });

  assertEquals(res.isSuccess, true);
  assertEquals(repo.logs.length, 1);
  assertEquals(repo.logs[0].toolName, 'consulta-stock');
  assertEquals(repo.logs[0].exitoso, true);
  assertEquals(repo.logs[0].duracionMs, 45);
});

Deno.test('RegistrarLogMcpToolUseCase: sanitiza claves sensibles de los parámetros', async () => {
  const repo = new MockLogMcpToolRepository();
  const useCase = new RegistrarLogMcpToolUseCase(repo);

  await useCase.execute({
    toolName: 'consulta-stock',
    usuarioId: '11111111-1111-1111-1111-111111111111',
    sucursalId: 1,
    parametros: {
      sku: 'PROD-001',
      token: 'jwt-secreto-que-no-debe-guardarse',
      passwordAdmin: '123456',
    },
    exitoso: true,
    duracionMs: 12,
  });

  assertEquals(repo.logs.length, 1);
  assertObjectMatch(repo.logs[0].parametros as Record<string, unknown>, {
    sku: 'PROD-001',
    token: '[REDACTADO]',
    passwordAdmin: '[REDACTADO]',
  });
});

Deno.test('RegistrarLogMcpToolUseCase: es resiliente si la persistencia falla', async () => {
  const repo = new MockLogMcpToolRepository();
  repo.debeFallar = true;
  const useCase = new RegistrarLogMcpToolUseCase(repo);

  const res = await useCase.execute({
    toolName: 'stock-bajo',
    usuarioId: '11111111-1111-1111-1111-111111111111',
    sucursalId: 1,
    parametros: {},
    exitoso: false,
    duracionMs: 10,
    error: 'TIMEOUT',
  });

  assertEquals(res.isSuccess, true); // No revienta el flujo del usuario
});

// ─── Pruebas de ConsultarLogsMcpToolsUseCase ────────────────────────────────────

Deno.test('ConsultarLogsMcpToolsUseCase: filtra logs por nombre de tool', async () => {
  const repo = new MockLogMcpToolRepository();
  await repo.registrar({
    toolName: 'consulta-stock',
    usuarioId: '11111111-1111-1111-1111-111111111111',
    sucursalId: 1,
    exitoso: true,
    duracionMs: 20,
  });
  await repo.registrar({
    toolName: 'ventas-periodo',
    usuarioId: '11111111-1111-1111-1111-111111111111',
    sucursalId: 1,
    exitoso: true,
    duracionMs: 80,
  });

  const useCase = new ConsultarLogsMcpToolsUseCase(repo);
  const res = await useCase.execute({ toolName: 'ventas-periodo', limite: 10, offset: 0 });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.total, 1);
  assertEquals(res.value.items[0].toolName, 'ventas-periodo');
});

// ─── Pruebas de Contratos Zod MCP (@warengine/contracts) ─────────────────────────

Deno.test('Zod MCP: consultaStockMcpSchema valida sku o nombre', () => {
  assertEquals(consultaStockMcpSchema.safeParse({ sku: 'ABC-123' }).success, true);
  assertEquals(consultaStockMcpSchema.safeParse({ nombre: 'Arroz' }).success, true);
  assertEquals(consultaStockMcpSchema.safeParse({}).success, false);
});

Deno.test('Zod MCP: stockBajoMcpSchema aplica valores por defecto', () => {
  const parsed = stockBajoMcpSchema.safeParse({});
  assertEquals(parsed.success, true);
  if (parsed.success) {
    assertEquals(parsed.data.limite, 20);
  }
});

Deno.test('Zod MCP: ventasPeriodoMcpSchema valida períodos permitidos', () => {
  assertEquals(ventasPeriodoMcpSchema.safeParse({ periodo: 'hoy' }).success, true);
  assertEquals(ventasPeriodoMcpSchema.safeParse({ periodo: 'invalido' }).success, false);
});

Deno.test('Zod MCP: estadoFacturaMcpSchema exige numero o id', () => {
  assertEquals(estadoFacturaMcpSchema.safeParse({ numeroFactura: 'FAC-001' }).success, true);
  assertEquals(estadoFacturaMcpSchema.safeParse({ facturaId: 15 }).success, true);
  assertEquals(estadoFacturaMcpSchema.safeParse({}).success, false);
});

Deno.test('Zod MCP: metricasGlobalesMcpSchema valida formato fecha si se provee', () => {
  assertEquals(
    metricasGlobalesMcpSchema.safeParse({
      periodo: 'personalizado',
      fechaInicio: '2026-01-01',
      fechaFin: '2026-01-31',
    }).success,
    true,
  );
  assertEquals(
    metricasGlobalesMcpSchema.safeParse({
      periodo: 'personalizado',
      fechaInicio: '01/01/2026', // Formato inválido
    }).success,
    false,
  );
});

Deno.test('Zod MCP: ajustarStockMcpSchema valida tipo y motivo mínimo', () => {
  assertEquals(
    ajustarStockMcpSchema.safeParse({
      sku: 'SKU-001',
      sucursalId: 1,
      cantidad: 5,
      tipo: 'ajuste_entrada',
      motivo: 'Ajuste físico de fin de mes',
    }).success,
    true,
  );

  // Falla por motivo demasiado corto (< 5 chars)
  assertEquals(
    ajustarStockMcpSchema.safeParse({
      sku: 'SKU-001',
      sucursalId: 1,
      cantidad: 5,
      tipo: 'ajuste_entrada',
      motivo: 'aj',
    }).success,
    false,
  );
});
