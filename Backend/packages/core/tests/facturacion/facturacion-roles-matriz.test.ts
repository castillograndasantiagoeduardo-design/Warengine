import { assertEquals } from '@std/assert';
import { createFacturacionRoutes } from '../../../../apps/api/src/routes/facturacion.routes.ts';
import { AppContainer } from '@warengine/composition';
import { Result } from '@warengine/shared-kernel';
import { PermisoDenegadoError } from '../../src/modules/autenticacion/domain/errors/AutenticacionErrors.ts';
import { FacturacionSinTurnoAbiertoError } from '../../src/modules/facturacion/domain/errors/FacturacionErrors.ts';
import { TurnoCaja } from '../../src/modules/facturacion/domain/entities/TurnoCaja.ts';
import { Factura } from '../../src/modules/facturacion/domain/entities/Factura.ts';
import { PERMISSIONS } from '@warengine/contracts';

const ROLES_PERMISOS = {
    cajero: [
        PERMISSIONS.INVENTARIO_LEER,
        PERMISSIONS.FACTURACION_CONSULTAR,
        PERMISSIONS.FACTURACION_FACTURAR,
        PERMISSIONS.FACTURACION_GESTIONAR_CLIENTES,
        PERMISSIONS.FACTURACION_ABRIR_TURNO,
        PERMISSIONS.FACTURACION_VENDER_B2B,
        PERMISSIONS.FACTURACION_ALERTAR_ADMIN,
        PERMISSIONS.MCP_CONSULTAR,
    ],
    vendedorB2b: [
        PERMISSIONS.INVENTARIO_LEER,
        PERMISSIONS.FACTURACION_CONSULTAR,
        PERMISSIONS.FACTURACION_GESTIONAR_CLIENTES,
        PERMISSIONS.FACTURACION_VENDER_B2B,
        PERMISSIONS.FACTURACION_ALERTAR_ADMIN,
        PERMISSIONS.MCP_CONSULTAR,
    ],
    adminSucursal: [
        PERMISSIONS.INVENTARIO_LEER,
        PERMISSIONS.INVENTARIO_ESCRIBIR,
        PERMISSIONS.FACTURACION_CONSULTAR,
        PERMISSIONS.FACTURACION_FACTURAR,
        PERMISSIONS.FACTURACION_GESTIONAR_CLIENTES,
        PERMISSIONS.FACTURACION_ABRIR_TURNO,
        PERMISSIONS.FACTURACION_VENDER_B2B,
        PERMISSIONS.FACTURACION_ALERTAR_ADMIN,
        PERMISSIONS.FACTURACION_ANULAR,
        PERMISSIONS.FACTURACION_DEVOLUCION,
        PERMISSIONS.ADMIN_VER_METRICAS_SUCURSAL,
    ],
    superAdmin: Object.values(PERMISSIONS),
};

function makeFacturaMock(id = 'fac-1', consecutivo = 1): Factura {
    return new Factura(
        id,
        consecutivo,
        crypto.randomUUID(),
        'usr-1',
        1,
        'turno-1',
        10000,
        1900,
        11900,
        'emitida',
        null,
        new Date(),
        [],
        [],
    );
}

function crearMockContainer(cajeroTieneTurno = true): AppContainer {
    return {
        autenticacion: {
            validarPermiso: {
                execute: (req: { accessToken: string; permisoRequerido?: string }) => {
                    let permisos: readonly string[] = [];
                    let usuarioId = 'usr-anon';
                    let rolId = 0;

                    if (req.accessToken === 'token-cajero') {
                        permisos = ROLES_PERMISOS.cajero;
                        usuarioId = cajeroTieneTurno ? 'usr-cajero-con-turno' : 'usr-cajero-sin-turno';
                        rolId = 3;
                    } else if (req.accessToken === 'token-vendedor-b2b') {
                        permisos = ROLES_PERMISOS.vendedorB2b;
                        usuarioId = 'usr-vendedor-1';
                        rolId = 4;
                    } else if (req.accessToken === 'token-admin-sucursal') {
                        permisos = ROLES_PERMISOS.adminSucursal;
                        usuarioId = 'usr-admin-1';
                        rolId = 2;
                    } else if (req.accessToken === 'token-super-admin') {
                        permisos = ROLES_PERMISOS.superAdmin;
                        usuarioId = 'usr-super-1';
                        rolId = 1;
                    } else {
                        return Promise.resolve(Result.fail(new PermisoDenegadoError('unauthorized')));
                    }

                    if (req.permisoRequerido && !permisos.includes(req.permisoRequerido)) {
                        return Promise.resolve(Result.fail(new PermisoDenegadoError(req.permisoRequerido)));
                    }

                    return Promise.resolve(
                        Result.ok({
                            usuarioId,
                            rolId,
                            permisos: [...permisos],
                        }),
                    );
                },
            },
        },
        facturacion: {
            abrirTurnoCaja: {
                execute: (req: { fondoInicial: number; actor: { usuarioId: string } }) =>
                    Promise.resolve(
                        Result.ok(new TurnoCaja('turno-1', req.actor.usuarioId, 1, req.fondoInicial, new Date(), null)),
                    ),
            },
            cerrarTurnoCaja: {
                execute: (req: { turnoId: string; fondoFinal: number }) =>
                    Promise.resolve(
                        Result.ok(new TurnoCaja(req.turnoId, 'usr-1', 1, 50000, new Date(), new Date(), req.fondoFinal, 0)),
                    ),
            },
            obtenerTurnoActual: {
                execute: () =>
                    Promise.resolve(Result.ok(new TurnoCaja('turno-1', 'usr-1', 1, 50000, new Date(), null))),
            },
            buscarClientes: { execute: () => Promise.resolve(Result.ok([])) },
            obtenerClientePorId: { execute: () => Promise.resolve(Result.ok({} as any)) },
            registrarCliente: { execute: () => Promise.resolve(Result.ok({ cliente: {} as any, yaExistia: false })) },
            actualizarCliente: { execute: () => Promise.resolve(Result.ok({} as any)) },
            crearFactura: {
                execute: (req: { actor: { usuarioId: string }; esB2B?: boolean }) => {
                    if (req.actor.usuarioId === 'usr-cajero-sin-turno' && !req.esB2B) {
                        return Promise.resolve(Result.fail(new FacturacionSinTurnoAbiertoError()));
                    }
                    return Promise.resolve(Result.ok(makeFacturaMock()));
                },
            },
            listarFacturas: { execute: () => Promise.resolve(Result.ok([makeFacturaMock()])) },
            obtenerFacturaPorId: { execute: () => Promise.resolve(Result.ok(makeFacturaMock())) },
            emitirAlertaFacturacion: {
                execute: (req: { motivo: string }) =>
                    Promise.resolve(Result.ok({ id: 'alerta-1', motivo: req.motivo } as any)),
            },
        },
    } as unknown as AppContainer;
}

const payloadFacturaValida = {
    clienteId: '123e4567-e89b-12d3-a456-426614174000',
    items: [
        {
            productoId: '123e4567-e89b-12d3-a456-426614174001',
            cantidad: 1,
            precioUnitario: 10000,
            descuento: 0,
        },
    ],
    pagos: [
        {
            medioPago: 'efectivo',
            monto: 11900,
        },
    ],
};

// ─── 1. MATRIZ CAJERO ────────────────────────────────────────────────────────
Deno.test('Matriz Cajero: 201 en facturar mostrador con turno abierto', async () => {
    const app = createFacturacionRoutes(crearMockContainer(true));
    const res = await app.request('/facturas', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer token-cajero', 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadFacturaValida),
    });
    assertEquals(res.status, 201);
});

Deno.test('Matriz Cajero: 400 sin turno abierto en facturar mostrador', async () => {
    const app = createFacturacionRoutes(crearMockContainer(false));
    const res = await app.request('/facturas', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer token-cajero', 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadFacturaValida),
    });
    assertEquals(res.status, 400);
    const data = await res.json();
    assertEquals(data.error, 'FACTURACION_SIN_TURNO_ABIERTO');
});

Deno.test('Matriz Cajero: 201 en vender B2B', async () => {
    const app = createFacturacionRoutes(crearMockContainer(false)); // Aunque no tenga turno, B2B pasa
    const res = await app.request('/facturas/b2b', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer token-cajero', 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadFacturaValida),
    });
    assertEquals(res.status, 201);
});

Deno.test('Matriz Cajero: 200 al cerrar su turno', async () => {
    const app = createFacturacionRoutes(crearMockContainer(true));
    const res = await app.request('/turnos/turno-1/cerrar', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer token-cajero', 'Content-Type': 'application/json' },
        body: JSON.stringify({ fondoFinal: 60000 }),
    });
    assertEquals(res.status, 200);
});

Deno.test('Matriz Cajero: 201 al emitir alerta operativa al admin', async () => {
    const app = createFacturacionRoutes(crearMockContainer(true));
    const res = await app.request('/alertas', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer token-cajero', 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: 'Faltante de papel para impresora térmica' }),
    });
    assertEquals(res.status, 201);
});

// ─── 2. MATRIZ VENDEDOR B2B ──────────────────────────────────────────────────
Deno.test('Matriz Vendedor-B2B: 201 en facturar B2B sin requerir turno', async () => {
    const app = createFacturacionRoutes(crearMockContainer());
    const res = await app.request('/facturas/b2b', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer token-vendedor-b2b', 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadFacturaValida),
    });
    assertEquals(res.status, 201);
});

Deno.test('Matriz Vendedor-B2B: 403 Forbidden al intentar facturar en mostrador (/facturas)', async () => {
    const app = createFacturacionRoutes(crearMockContainer());
    const res = await app.request('/facturas', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer token-vendedor-b2b', 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadFacturaValida),
    });
    assertEquals(res.status, 403);
});

Deno.test('Matriz Vendedor-B2B: 403 Forbidden al abrir y cerrar turno', async () => {
    const app = createFacturacionRoutes(crearMockContainer());
    const resAbrir = await app.request('/turnos', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer token-vendedor-b2b', 'Content-Type': 'application/json' },
        body: JSON.stringify({ fondoInicial: 50000 }),
    });
    assertEquals(resAbrir.status, 403);

    const resCerrar = await app.request('/turnos/turno-1/cerrar', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer token-vendedor-b2b', 'Content-Type': 'application/json' },
        body: JSON.stringify({ fondoFinal: 50000 }),
    });
    assertEquals(resCerrar.status, 403);
});

// ─── 3. MATRIZ ADMIN-SUCURSAL Y SUPER-ADMIN ──────────────────────────────────
Deno.test('Matriz Admin-Sucursal y Super-Admin: acceso autorizado a facturacion mostrador y B2B', async () => {
    const app = createFacturacionRoutes(crearMockContainer());

    for (const token of ['token-admin-sucursal', 'token-super-admin']) {
        const resB2b = await app.request('/facturas/b2b', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadFacturaValida),
        });
        assertEquals(resB2b.status, 201);

        const resMostrador = await app.request('/facturas', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadFacturaValida),
        });
        assertEquals(resMostrador.status, 201);

        const resListar = await app.request('/facturas', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        assertEquals(resListar.status, 200);
    }
});
