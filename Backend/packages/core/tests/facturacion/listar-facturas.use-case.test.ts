/**
 * listar-facturas.use-case.test.ts
 *
 * Pruebas unitarias para ListarFacturasUseCase con filtros, paginación,
 * campos enriquecidos y validación de alcance por sucursal.
 */

import { assertEquals } from 'jsr:@std/assert@^1';
import {
    ActorAuditoria,
    Factura,
    FacturaItem,
    FacturaPago,
    FacturasPaginadasResultado,
    FiltrosFacturas,
    IFacturaRepository,
    ISucursalOperadorRepository,
    ListarFacturasUseCase,
    OperadorSinSucursalError,
} from '../../mod.ts';
import { PERMISSIONS } from '@warengine/contracts';

const actorLocal: ActorAuditoria = {
    usuarioId: 'usr-admin-local',
    ip: '127.0.0.1',
    permisos: [PERMISSIONS.FACTURACION_CONSULTAR],
};

const actorGlobal: ActorAuditoria = {
    usuarioId: 'usr-super-admin',
    ip: '127.0.0.1',
    permisos: [PERMISSIONS.FACTURACION_CONSULTAR, PERMISSIONS.ADMIN_VER_METRICAS_GLOBALES],
};

function crearSucursalOperadorRepoFalso(sucursales: Record<string, number | null>): ISucursalOperadorRepository {
    return {
        obtenerSucursalId: (usuarioId: string) => Promise.resolve(sucursales[usuarioId] ?? null),
    };
}

function crearFacturaRepoFalso(facturasIniciales: Factura[]): IFacturaRepository & {
    ultimoFiltro: FiltrosFacturas | null;
    items: Factura[];
} {
    const state = {
        ultimoFiltro: null as FiltrosFacturas | null,
        items: [...facturasIniciales],
    };

    return {
        get ultimoFiltro() { return state.ultimoFiltro; },
        get items() { return state.items; },
        crear: () => Promise.reject(new Error('no implementado')),
        findById: (id: string) => Promise.resolve(state.items.find((f) => f.id === id) ?? null),
        anular: () => Promise.reject(new Error('no implementado')),
        obtenerSiguienteConsecutivo: () => Promise.resolve(1),
        listar: (filtros: FiltrosFacturas) => {
            state.ultimoFiltro = filtros;
            return Promise.resolve(state.items);
        },
        listarPaginado: (filtros: FiltrosFacturas): Promise<FacturasPaginadasResultado> => {
            state.ultimoFiltro = filtros;
            let filtradas = [...state.items];

            if (filtros.sucursalId !== undefined) {
                filtradas = filtradas.filter((f) => f.sucursalId === filtros.sucursalId);
            }
            if (filtros.clienteId) {
                filtradas = filtradas.filter((f) => f.clienteId === filtros.clienteId);
            }
            if (filtros.estado) {
                filtradas = filtradas.filter((f) => f.estado === filtros.estado);
            }
            if (filtros.tipo) {
                filtradas = filtradas.filter((f) => f.tipoVenta === filtros.tipo);
            }
            if (filtros.texto) {
                const t = filtros.texto.toLowerCase();
                filtradas = filtradas.filter((f) =>
                    (f.clienteNombre ?? '').toLowerCase().includes(t) ||
                    (f.clienteDocumento ?? '').toLowerCase().includes(t) ||
                    String(f.consecutivo).includes(t)
                );
            }

            const total = filtradas.length;
            const slice = filtradas.slice(filtros.offset, filtros.offset + filtros.limite);
            return Promise.resolve({ items: slice, total });
        },
    };
}

function sampleFactura(opts: {
    id: string;
    consecutivo: number;
    sucursalId: number;
    estado?: 'emitida' | 'anulada';
    clienteNombre?: string;
    cajeroNombre?: string;
    tipoVenta?: 'POS' | 'B2B';
    total?: number;
}): Factura {
    return new Factura(
        opts.id,
        opts.consecutivo,
        'cli-1',
        'usr-cajero-1',
        opts.sucursalId,
        opts.tipoVenta === 'B2B' ? null : 'turno-1',
        opts.total ?? 10000,
        0,
        opts.total ?? 10000,
        opts.estado ?? 'emitida',
        null,
        new Date('2026-03-01T10:00:00Z'),
        [
            new FacturaItem(
                'item-1',
                opts.id,
                'prod-1',
                2,
                5000,
                0,
                10000,
                'Gaseosa 500ml',
            ),
        ],
        [
            new FacturaPago(
                'pago-1',
                opts.id,
                'efectivo',
                opts.total ?? 10000,
                null,
                new Date('2026-03-01T10:00:00Z'),
            ),
        ],
        opts.clienteNombre ?? 'Consumidor Final',
        '222222222222',
        opts.cajeroNombre ?? 'Carlos Cajero',
        opts.tipoVenta ?? 'POS',
        [],
    );
}

Deno.test('ListarFacturasUseCase: operador local sólo lista facturas de su sucursal (alcance forzado)', async () => {
    const repo = crearFacturaRepoFalso([
        sampleFactura({ id: 'f-1', consecutivo: 101, sucursalId: 1 }),
        sampleFactura({ id: 'f-2', consecutivo: 102, sucursalId: 2 }),
    ]);
    const sucursalOpRepo = crearSucursalOperadorRepoFalso({
        'usr-admin-local': 1,
    });

    const useCase = new ListarFacturasUseCase(repo, sucursalOpRepo);

    // Aunque intente filtrar por sucursal 2, el use case fuerza sucursalId: 1
    const res = await useCase.execute({
        actor: actorLocal,
        sucursalId: 2,
    });

    assertEquals(res.isSuccess, true);
    assertEquals(res.value.total, 1);
    assertEquals(res.value.items.length, 1);
    assertEquals(res.value.items[0].id, 'f-1');
    assertEquals(repo.ultimoFiltro?.sucursalId, 1);
});

Deno.test('ListarFacturasUseCase: operador global puede consultar cualquier sede o todas', async () => {
    const repo = crearFacturaRepoFalso([
        sampleFactura({ id: 'f-1', consecutivo: 101, sucursalId: 1 }),
        sampleFactura({ id: 'f-2', consecutivo: 102, sucursalId: 2 }),
    ]);
    const sucursalOpRepo = crearSucursalOperadorRepoFalso({});

    const useCase = new ListarFacturasUseCase(repo, sucursalOpRepo);

    const res = await useCase.execute({
        actor: actorGlobal,
        sucursalId: 2,
    });

    assertEquals(res.isSuccess, true);
    assertEquals(res.value.total, 1);
    assertEquals(res.value.items[0].id, 'f-2');
    assertEquals(repo.ultimoFiltro?.sucursalId, 2);
});

Deno.test('ListarFacturasUseCase: calcula total, totalPaginas, page y limite correctamente', async () => {
    const facturas = Array.from({ length: 25 }, (_, i) =>
        sampleFactura({ id: `f-${i + 1}`, consecutivo: 100 + i, sucursalId: 1 })
    );
    const repo = crearFacturaRepoFalso(facturas);
    const sucursalOpRepo = crearSucursalOperadorRepoFalso({ 'usr-admin-local': 1 });

    const useCase = new ListarFacturasUseCase(repo, sucursalOpRepo);

    const res = await useCase.execute({
        actor: actorLocal,
        page: 2,
        limite: 10,
    });

    assertEquals(res.isSuccess, true);
    assertEquals(res.value.total, 25);
    assertEquals(res.value.totalPaginas, 3);
    assertEquals(res.value.page, 2);
    assertEquals(res.value.limite, 10);
    assertEquals(res.value.items.length, 10);
    assertEquals(res.value.items[0].id, 'f-11');
});

Deno.test('ListarFacturasUseCase: filtra por texto, tipo y estado', async () => {
    const repo = crearFacturaRepoFalso([
        sampleFactura({ id: 'f-1', consecutivo: 101, sucursalId: 1, clienteNombre: 'Empresa XYZ', tipoVenta: 'B2B', estado: 'emitida' }),
        sampleFactura({ id: 'f-2', consecutivo: 102, sucursalId: 1, clienteNombre: 'Juan Perez', tipoVenta: 'POS', estado: 'emitida' }),
        sampleFactura({ id: 'f-3', consecutivo: 103, sucursalId: 1, clienteNombre: 'Empresa ABC', tipoVenta: 'B2B', estado: 'anulada' }),
    ]);
    const sucursalOpRepo = crearSucursalOperadorRepoFalso({ 'usr-admin-local': 1 });

    const useCase = new ListarFacturasUseCase(repo, sucursalOpRepo);

    const res = await useCase.execute({
        actor: actorLocal,
        texto: 'Empresa',
        tipo: 'B2B',
        estado: 'emitida',
    });

    assertEquals(res.isSuccess, true);
    assertEquals(res.value.total, 1);
    assertEquals(res.value.items[0].id, 'f-1');
    assertEquals(res.value.items[0].clienteNombre, 'Empresa XYZ');
});

Deno.test('ListarFacturasUseCase: devuelve campos enriquecidos (clienteNombre, cajeroNombre, productoNombre)', async () => {
    const repo = crearFacturaRepoFalso([
        sampleFactura({
            id: 'f-1',
            consecutivo: 201,
            sucursalId: 1,
            clienteNombre: 'Maria Lopez',
            cajeroNombre: 'Pedro Operador',
            tipoVenta: 'POS',
        }),
    ]);
    const sucursalOpRepo = crearSucursalOperadorRepoFalso({ 'usr-admin-local': 1 });

    const useCase = new ListarFacturasUseCase(repo, sucursalOpRepo);

    const res = await useCase.execute({ actor: actorLocal });

    assertEquals(res.isSuccess, true);
    const factura = res.value.items[0];
    assertEquals(factura.clienteNombre, 'Maria Lopez');
    assertEquals(factura.cajeroNombre, 'Pedro Operador');
    assertEquals(factura.tipoVenta, 'POS');
    assertEquals(factura.items[0].productoNombre, 'Gaseosa 500ml');
});

Deno.test('ListarFacturasUseCase: falla si operador local no tiene sucursal asignada', async () => {
    const repo = crearFacturaRepoFalso([]);
    const sucursalOpRepo = crearSucursalOperadorRepoFalso({}); // No sucursal

    const useCase = new ListarFacturasUseCase(repo, sucursalOpRepo);

    const res = await useCase.execute({ actor: actorLocal });

    assertEquals(res.isFailure, true);
    assertEquals(res.error instanceof OperadorSinSucursalError, true);
});
