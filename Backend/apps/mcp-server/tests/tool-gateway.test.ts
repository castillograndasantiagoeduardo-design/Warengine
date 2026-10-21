import { assertEquals, assertObjectMatch } from 'jsr:@std/assert@^1';
import { z } from 'zod';
import { DomainError, Result } from '@warengine/shared-kernel';
import type { AppContainer } from '@warengine/composition';
import type { McpSessionContext } from '../src/session/index.ts';
import { McpAuthorizationGateway } from '../src/gateway/index.ts';
import {
  obtenerToolsAutorizadasParaUsuario,
  registrarToolEnCatalogo,
  type DefinicionToolMcp,
} from '../src/catalog/index.ts';

// ─── Fixtures y Mocks ────────────────────────────────────────────────────────

function crearMockContainer() {
  const logsRegistrados: any[] = [];
  return {
    mcp: {
      registrarLog: {
        execute: (log: any) => {
          logsRegistrados.push(log);
          return Promise.resolve(Result.ok(undefined));
        },
      },
    },
    _logs: logsRegistrados,
  } as unknown as AppContainer & { _logs: any[] };
}

function crearSesionUsuario(
  permisos: string[] = ['mcp:consultar'],
  esGlobal = false,
  sucursalId = 2,
): McpSessionContext {
  return {
    usuarioId: '11111111-1111-1111-1111-111111111111',
    rolId: 3, // cajero-vendedor
    sucursalId,
    sucursalesPermitidas: [sucursalId],
    esGlobal,
    permisos,
    sessionId: 'session-test-uuid',
    actor: {
      usuarioId: '11111111-1111-1111-1111-111111111111',
      ip: null,
      permisos,
    },
    createdAt: new Date(),
  };
}

// ─── 1. Pruebas de Fail-Fast Authorization (RF-SA-I6 / RF-SA-I12) ────────────

Deno.test('McpAuthorizationGateway: rechaza inmediatamente si falta el permiso y registra auditoría', async () => {
  const container = crearMockContainer();
  const session = crearSesionUsuario(['mcp:consultar']); // No tiene 'mcp:herramientas-financieras'
  let handlerEjecutado = false;

  const respuesta = await McpAuthorizationGateway.procesarTool({
    toolName: 'metricas-globales',
    permisoRequerido: 'mcp:herramientas-financieras',
    args: { periodo: 'mes' },
    sessionContext: session,
    container,
    handler: () => {
      handlerEjecutado = true;
      return Promise.resolve(Result.ok({}));
    },
  });

  // 1. Debe retornar error
  assertEquals(respuesta.isError, true);
  assertEquals(
    respuesta.content[0].text,
    'No tienes los permisos necesarios para realizar esta consulta u operación en el sistema.',
  );

  // 2. El handler del core NUNCA debe ejecutarse
  assertEquals(handlerEjecutado, false);

  // 3. Debe quedar registrado en logs_mcp_tools
  assertEquals(container._logs.length, 1);
  assertEquals(container._logs[0].toolName, 'metricas-globales');
  assertEquals(container._logs[0].exitoso, false);
  assertEquals(container._logs[0].error, 'PERMISO_DENEGADO');
});

// ─── 2. Pruebas de Validación con Zod (RF-SA-I10) ─────────────────────────────

Deno.test('McpAuthorizationGateway: rechaza parámetros inválidos antes del handler', async () => {
  const container = crearMockContainer();
  const session = crearSesionUsuario(['mcp:consultar']);
  let handlerEjecutado = false;

  const schema = z.object({
    sku: z.string().min(3, 'El SKU debe tener al menos 3 caracteres.'),
  });

  const respuesta = await McpAuthorizationGateway.procesarTool({
    toolName: 'consulta-stock',
    permisoRequerido: 'mcp:consultar',
    schema,
    args: { sku: 'AB' }, // Inválido: solo 2 caracteres
    sessionContext: session,
    container,
    handler: () => {
      handlerEjecutado = true;
      return Promise.resolve(Result.ok({}));
    },
  });

  assertEquals(respuesta.isError, true);
  assertEquals(
    respuesta.content[0].text.includes('El SKU debe tener al menos 3 caracteres'),
    true,
  );
  assertEquals(handlerEjecutado, false);

  // Auditoría registrada
  assertEquals(container._logs.length, 1);
  assertEquals(container._logs[0].error, 'PARAMETROS_INVALIDOS');
});

// ─── 3. Pruebas de Forzado de Sucursal (Anti-Bypass: RF-SA-I4) ────────────────

Deno.test('McpAuthorizationGateway: fuerza la sucursal del token si el usuario no es global', async () => {
  const container = crearMockContainer();
  const session = crearSesionUsuario(['mcp:consultar'], false, 2); // Sucursal 2
  let sucursalRecibidaPorHandler: number | null = null;

  const schema = z.object({
    sku: z.string(),
    sucursalId: z.number().optional(),
  });

  await McpAuthorizationGateway.procesarTool({
    toolName: 'consulta-stock',
    permisoRequerido: 'mcp:consultar',
    schema,
    args: { sku: 'PROD-001', sucursalId: 99 }, // El LLM o atacante intenta enviar sucursal 99
    sessionContext: session,
    container,
    handler: (args) => {
      sucursalRecibidaPorHandler = args.sucursalId!;
      return Promise.resolve(Result.ok({ stock: 10 }));
    },
  });

  // El Gateway debe forzar sucursal 2 e ignorar el 99 enviado
  assertEquals(sucursalRecibidaPorHandler, 2);
});

Deno.test('McpAuthorizationGateway: permite sucursal libre a SuperAdmin (alcance global)', async () => {
  const container = crearMockContainer();
  const session = crearSesionUsuario(['mcp:consultar'], true, 1); // esGlobal = true
  let sucursalRecibidaPorHandler: number | null = null;

  const schema = z.object({
    sku: z.string(),
    sucursalId: z.number().optional(),
  });

  await McpAuthorizationGateway.procesarTool({
    toolName: 'consulta-stock',
    permisoRequerido: 'mcp:consultar',
    schema,
    args: { sku: 'PROD-001', sucursalId: 5 }, // SuperAdmin consulta sucursal 5
    sessionContext: session,
    container,
    handler: (args) => {
      sucursalRecibidaPorHandler = args.sucursalId!;
      return Promise.resolve(Result.ok({ stock: 25 }));
    },
  });

  assertEquals(sucursalRecibidaPorHandler, 5);
});

// ─── 4. Pruebas de Ejecución Exitosa y Registro de Auditoría (RF-SA-I9) ───────

Deno.test('McpAuthorizationGateway: ejecuta handler exitoso y registra auditoría forense', async () => {
  const container = crearMockContainer();
  const session = crearSesionUsuario(['mcp:consultar'], false, 1);

  const respuesta = await McpAuthorizationGateway.procesarTool({
    toolName: 'consulta-stock',
    permisoRequerido: 'mcp:consultar',
    args: { sku: 'ARROZ-01' },
    sessionContext: session,
    container,
    handler: () => {
      return Promise.resolve(Result.ok({ producto: 'Arroz', stockActual: 100 }));
    },
  });

  assertEquals(respuesta.isError, undefined);
  assertEquals(respuesta.content[0].text.includes('Arroz'), true);

  // Auditoría forense
  assertEquals(container._logs.length, 1);
  assertEquals(container._logs[0].toolName, 'consulta-stock');
  assertEquals(container._logs[0].exitoso, true);
  assertEquals(container._logs[0].error, null);
});

// ─── 5. Pruebas de Catálogo Dinámico por Rol (RF-SA-I1) ───────────────────────

Deno.test('Catálogo Dinámico: expone únicamente herramientas autorizadas para el usuario', () => {
  const toolLectura: DefinicionToolMcp = {
    name: 'test-lectura',
    description: 'Consulta de lectura',
    permisoRequerido: 'mcp:consultar',
    handler: () => Promise.resolve(Result.ok({})),
  };

  const toolFinanciera: DefinicionToolMcp = {
    name: 'test-financiera',
    description: 'Reporte financiero',
    permisoRequerido: 'mcp:herramientas-financieras',
    handler: () => Promise.resolve(Result.ok({})),
  };

  registrarToolEnCatalogo(toolLectura);
  registrarToolEnCatalogo(toolFinanciera);

  // Sesión Cajero (solo 'mcp:consultar')
  const sesionCajero = crearSesionUsuario(['mcp:consultar']);
  const toolsCajero = obtenerToolsAutorizadasParaUsuario(sesionCajero);
  assertEquals(toolsCajero.some((t) => t.name === 'test-lectura'), true);
  assertEquals(toolsCajero.some((t) => t.name === 'test-financiera'), false); // INVISIBLE

  // Sesión SuperAdmin (posee ambos permisos)
  const sesionSuperAdmin = crearSesionUsuario([
    'mcp:consultar',
    'mcp:herramientas-financieras',
  ]);
  const toolsSuperAdmin = obtenerToolsAutorizadasParaUsuario(sesionSuperAdmin);
  assertEquals(toolsSuperAdmin.some((t) => t.name === 'test-lectura'), true);
  assertEquals(toolsSuperAdmin.some((t) => t.name === 'test-financiera'), true); // VISIBLE
});
