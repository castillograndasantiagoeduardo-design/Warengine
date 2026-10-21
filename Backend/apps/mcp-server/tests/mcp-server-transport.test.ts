import { assertEquals } from 'jsr:@std/assert@^1';
import http from 'node:http';
import {
  extraerTokenDeRequest,
  SessionManager,
} from '../src/session/index.ts';
import { createMcpHttpServer } from '../src/server.ts';
import type { AppContainer } from '@warengine/composition';

// ─── Pruebas de extracción de Tokens ──────────────────────────────────────────

Deno.test('extraerTokenDeRequest: extrae desde cabecera Authorization Bearer', () => {
  const req = {
    headers: { authorization: 'Bearer mi-token-secreto-jwt' },
    url: '/sse',
  } as unknown as http.IncomingMessage;

  const token = extraerTokenDeRequest(req);
  assertEquals(token, 'mi-token-secreto-jwt');
});

Deno.test('extraerTokenDeRequest: extrae desde query param ?token=', () => {
  const req = {
    headers: {},
    url: '/sse?token=token-por-query-param',
  } as unknown as http.IncomingMessage;

  const token = extraerTokenDeRequest(req);
  assertEquals(token, 'token-por-query-param');
});

Deno.test('extraerTokenDeRequest: extrae desde Cookie accessToken', () => {
  const req = {
    headers: { cookie: 'otraCookie=123; accessToken=token-por-cookie; sessionId=abc' },
    url: '/sse',
  } as unknown as http.IncomingMessage;

  const token = extraerTokenDeRequest(req);
  assertEquals(token, 'token-por-cookie');
});

Deno.test('extraerTokenDeRequest: devuelve null si no se proporciona token', () => {
  const req = {
    headers: {},
    url: '/sse',
  } as unknown as http.IncomingMessage;

  const token = extraerTokenDeRequest(req);
  assertEquals(token, null);
});

// ─── Pruebas de SessionManager ────────────────────────────────────────────────

Deno.test('SessionManager: registra, consulta y remueve sesiones activas', () => {
  const manager = new SessionManager();
  assertEquals(manager.cantidadSesionesActivas, 0);

  const mockContext = {
    usuarioId: '11111111-1111-1111-1111-111111111111',
    rolId: 1,
    sucursalId: 1,
    esGlobal: true,
    permisos: ['mcp:consultar'],
    sessionId: 'session-test-123',
    actor: {
      usuarioId: '11111111-1111-1111-1111-111111111111',
      ip: null,
      permisos: ['mcp:consultar'],
    },
    createdAt: new Date(),
  };

  const mockTransport = {} as any;

  manager.registrar('session-test-123', mockContext, mockTransport);
  assertEquals(manager.cantidadSesionesActivas, 1);
  assertEquals(manager.obtenerContexto('session-test-123')?.usuarioId, mockContext.usuarioId);

  manager.remover('session-test-123');
  assertEquals(manager.cantidadSesionesActivas, 0);
  assertEquals(manager.obtener('session-test-123'), undefined);
});

// ─── Pruebas HTTP del Servidor MCP ───────────────────────────────────────────

Deno.test('createMcpHttpServer: responde a /health y rechaza /sse sin token', async () => {
  // Mock simplificado del AppContainer
  const mockContainer = {
    autenticacion: {
      validarPermiso: {
        execute: () => Promise.resolve({ isFailure: true, error: { code: 'TOKEN_INVALIDO', message: 'Falta token' } }),
      },
      resolverAlcanceSucursal: {
        execute: () => Promise.resolve({ isSuccess: true, value: { esGlobal: true, sucursalesPermitidas: () => undefined } }),
      },
    },
  } as unknown as AppContainer;

  const server = createMcpHttpServer(mockContainer, {
    port: 0,
    host: '127.0.0.1',
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 1. GET /health
    const healthRes = await fetch(`${baseUrl}/health`);
    assertEquals(healthRes.status, 200);
    const healthJson = await healthRes.json();
    assertEquals(healthJson.status, 'ok');
    assertEquals(healthJson.servidor, 'warengine-mcp-server');

    // 2. OPTIONS /sse (CORS)
    const optionsRes = await fetch(`${baseUrl}/sse`, { method: 'OPTIONS' });
    assertEquals(optionsRes.status, 204);
    assertEquals(optionsRes.headers.get('access-control-allow-origin'), '*');

    // 3. GET /sse sin token -> 401 Unauthorized
    const sseSinTokenRes = await fetch(`${baseUrl}/sse`);
    assertEquals(sseSinTokenRes.status, 401);
    const sseErrorJson = await sseSinTokenRes.json();
    assertEquals(sseErrorJson.error, 'TOKEN_INVALIDO');

    // 4. POST /message sin sessionId -> 400 Bad Request
    const messageSinSession = await fetch(`${baseUrl}/message`, { method: 'POST' });
    assertEquals(messageSinSession.status, 400);

    // 5. GET /ruta-inexistente -> 404
    const notFoundRes = await fetch(`${baseUrl}/inexistente`);
    assertEquals(notFoundRes.status, 404);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
