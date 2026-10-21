import { assertEquals } from 'jsr:@std/assert@^1';
import { Hono } from 'hono';
import { Result } from '@warengine/shared-kernel';
import type { AppContainer } from '@warengine/composition';
import { createAsistenteRoutes } from '../src/routes/asistente.routes.ts';

function crearMockContainerParaApi() {
  return {
    autenticacion: {
      validarPermiso: {
        execute: (req: any) => {
          if (req.accessToken === 'token-invalido') {
            return Promise.resolve(Result.fail({ code: 'TOKEN_INVALIDO', message: 'Token revocado' } as any));
          }
          return Promise.resolve(
            Result.ok({
              usuarioId: 'user-uuid-1',
              rolId: 1,
              permisos: ['mcp:consultar', 'mcp:ejecutar-herramientas'],
            }),
          );
        },
      },
    },
    asistente: {
      conversar: {
        execute: (req: any) => {
          return Promise.resolve(
            Result.ok({
              respuesta: `Procesado: ${req.mensaje}. Existencias: 15 unidades.`,
              toolsEjecutadas: ['consulta-stock'],
            }),
          );
        },
      },
    },
  } as unknown as AppContainer;
}

Deno.test('Rutas Asistente: POST /chat rechaza peticiones sin cabecera Authorization (401)', async () => {
  const container = crearMockContainerParaApi();
  const app = new Hono();
  app.route('/asistente', createAsistenteRoutes(container));

  const res = await app.request('/asistente/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mensaje: '¿Hay stock?' }),
  });

  assertEquals(res.status, 401);
  const json = await res.json();
  assertEquals(json.error, 'TOKEN_INVALIDO');
});

Deno.test('Rutas Asistente: POST /chat rechaza cuerpo con mensaje vacío (400)', async () => {
  const container = crearMockContainerParaApi();
  const app = new Hono();
  app.route('/asistente', createAsistenteRoutes(container));

  const res = await app.request('/asistente/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer token-valido',
    },
    body: JSON.stringify({ mensaje: '   ' }),
  });

  assertEquals(res.status, 400);
  const json = await res.json();
  assertEquals(json.error, 'VALIDATION_ERROR');
});

Deno.test('Rutas Asistente: POST /chat procesa mensaje y retorna respuesta con tools (200)', async () => {
  const container = crearMockContainerParaApi();
  const app = new Hono();
  app.route('/asistente', createAsistenteRoutes(container));

  const res = await app.request('/asistente/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer token-valido',
    },
    body: JSON.stringify({
      mensaje: '¿Cuál es el stock de laptops?',
      historial: [],
    }),
  });

  assertEquals(res.status, 200);
  const json = await res.json();
  assertEquals(json.respuesta.includes('15 unidades'), true);
  assertEquals(json.toolsEjecutadas, ['consulta-stock']);
  assertEquals(typeof json.fecha, 'string');
});
