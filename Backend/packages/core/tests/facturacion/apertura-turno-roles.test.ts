import { assertEquals } from 'jsr:@std/assert';
import { createFacturacionRoutes } from '../../../../apps/api/src/routes/facturacion.routes.ts';
import { AppContainer } from '@warengine/composition';
import { Result } from '@warengine/shared-kernel';
import { PermisoDenegadoError } from '../../src/modules/autenticacion/domain/errors/AutenticacionErrors.ts';
import { TurnoCaja } from '../../src/modules/facturacion/domain/entities/TurnoCaja.ts';
import { PERMISSIONS } from '@warengine/contracts';

function crearMockContainer(): AppContainer {
  return {
    autenticacion: {
      validarPermiso: {
        execute: (req: { accessToken: string; permisoRequerido?: string }) => {
          if (req.accessToken === 'token-cajero') {
            return Promise.resolve(
              Result.ok({
                usuarioId: 'usr-cajero-1',
                rolId: 3,
                permisos: [
                  PERMISSIONS.INVENTARIO_LEER,
                  PERMISSIONS.FACTURACION_CONSULTAR,
                  PERMISSIONS.FACTURACION_FACTURAR,
                  PERMISSIONS.FACTURACION_GESTIONAR_CLIENTES,
                  PERMISSIONS.FACTURACION_ABRIR_TURNO,
                  PERMISSIONS.FACTURACION_VENDER_B2B,
                  PERMISSIONS.FACTURACION_ALERTAR_ADMIN,
                  PERMISSIONS.MCP_CONSULTAR,
                ],
              }),
            );
          }

          if (req.accessToken === 'token-vendedor-b2b') {
            const permisosVendedor = [
              PERMISSIONS.INVENTARIO_LEER,
              PERMISSIONS.FACTURACION_CONSULTAR,
              PERMISSIONS.FACTURACION_FACTURAR,
              PERMISSIONS.FACTURACION_GESTIONAR_CLIENTES,
              PERMISSIONS.FACTURACION_VENDER_B2B,
              PERMISSIONS.FACTURACION_ALERTAR_ADMIN,
              PERMISSIONS.MCP_CONSULTAR,
            ];

            if (req.permisoRequerido && !permisosVendedor.includes(req.permisoRequerido as any)) {
              return Promise.resolve(Result.fail(new PermisoDenegadoError(req.permisoRequerido)));
            }

            return Promise.resolve(
              Result.ok({
                usuarioId: 'usr-vendedor-1',
                rolId: 4,
                permisos: permisosVendedor,
              }),
            );
          }

          return Promise.resolve(Result.fail(new PermisoDenegadoError('unauthorized')));
        },
      },
    },
    facturacion: {
      abrirTurnoCaja: {
        execute: (req: { fondoInicial: number; actor: { usuarioId: string } }) => {
          return Promise.resolve(
            Result.ok(new TurnoCaja('turno-100', req.actor.usuarioId, 1, req.fondoInicial, new Date(), null)),
          );
        },
      },
      obtenerTurnoActual: {
        execute: () => {
          return Promise.resolve(
            Result.ok(new TurnoCaja('turno-100', 'usr-cajero-1', 1, 50000, new Date(), null)),
          );
        },
      },
      buscarClientes: { execute: () => Promise.resolve(Result.ok([])) },
      registrarCliente: { execute: () => Promise.resolve(Result.ok({} as any)) },
    },
  } as unknown as AppContainer;
}

Deno.test('Ruta apertura turno: cajero abre turno exitosamente (HTTP 200/201)', async () => {
  const container = crearMockContainer();
  const app = createFacturacionRoutes(container);

  const res = await app.request('/turnos', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer token-cajero',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fondoInicial: 50000 }),
  });

  assertEquals(res.status, 201);
  const data = await res.json();
  assertEquals(data.id, 'turno-100');
  assertEquals(data.fondoInicial, 50000);
});

Deno.test('Ruta apertura turno: vendedor-b2b recibe 403 Forbidden al intentar abrir turno', async () => {
  const container = crearMockContainer();
  const app = createFacturacionRoutes(container);

  const res = await app.request('/turnos', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer token-vendedor-b2b',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fondoInicial: 50000 }),
  });

  assertEquals(res.status, 403);
  const data = await res.json();
  assertEquals(data.error, 'PERMISO_DENEGADO');
  assertEquals(data.message.includes('facturacion:abrir-turno'), true);
});

Deno.test('Ruta turno actual: vendedor-b2b SÍ puede consultar turno actual (facturacion:facturar)', async () => {
  const container = crearMockContainer();
  const app = createFacturacionRoutes(container);

  const res = await app.request('/turnos/actual', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer token-vendedor-b2b',
    },
  });

  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(data.id, 'turno-100');
});
