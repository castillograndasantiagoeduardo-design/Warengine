import { assertEquals } from '@std/assert';
import {
    ACCIONES_AUDITORIA,
    ActorAuditoria,
    Cliente,
    CrearFacturaUseCase,
    ENTIDADES_AUDITORIA,
    Factura,
    FacturaItem,
    FacturaPago,
    IAuditor,
    IClienteRepository,
    IFacturaRepository,
    ISucursalOperadorRepository,
    ITurnoCajaRepository,
    TurnoCaja,
} from '../../mod.ts';

class FakeAuditor implements IAuditor {
    public eventos: any[] = [];
    public registrar(evento: any): Promise<void> {
        this.eventos.push(evento);
        return Promise.resolve();
    }
}

const actorCajeroConTurno: ActorAuditoria = {
    usuarioId: 'usr-cajero-1',
    ip: '127.0.0.1',
    permisos: ['facturacion:facturar', 'facturacion:abrir-turno', 'facturacion:vender-b2b'],
};

const actorCajeroSinTurno: ActorAuditoria = {
    usuarioId: 'usr-cajero-2',
    ip: '127.0.0.1',
    permisos: ['facturacion:facturar', 'facturacion:abrir-turno'],
};

const actorVendedorB2B: ActorAuditoria = {
    usuarioId: 'usr-vendedor-1',
    ip: '127.0.0.1',
    permisos: ['facturacion:vender-b2b', 'facturacion:consultar'],
};

function makeCliente(id = 'cli-1', tipo: 'B2C' | 'B2B' = 'B2C', credito = false): Cliente {
    return new Cliente(
        id,
        'CC',
        '10203040',
        'Cliente Prueba',
        tipo,
        'cliente@prueba.com',
        '3001112233',
        'Calle 1 # 2-3',
        credito,
    );
}

function makeTurno(id = 'turno-1', usuarioId = 'usr-cajero-1'): TurnoCaja {
    return new TurnoCaja(id, usuarioId, 1, 50000, new Date(), null, null, null);
}

function armar(opciones: {
    turnosAbiertos?: Record<string, TurnoCaja | null>;
    clientes?: Record<string, Cliente | null>;
    sucursalId?: number | null;
}) {
    const auditor = new FakeAuditor();
    const facturasGuardadas: Factura[] = [];

    const facturaRepo: IFacturaRepository = {
        obtenerSiguienteConsecutivo: () => Promise.resolve(facturasGuardadas.length + 1),
        crear: (datos) => {
            const f = new Factura(
                datos.factura.id,
                facturasGuardadas.length + 1,
                datos.factura.clienteId,
                datos.factura.usuarioId,
                datos.factura.sucursalId,
                datos.factura.turnoCajaId,
                datos.factura.subtotal,
                datos.factura.iva,
                datos.factura.total,
                'emitida',
                null,
                new Date(),
                datos.items,
                datos.pagos,
            );
            facturasGuardadas.push(f);
            return Promise.resolve(f);
        },
        findById: (id: string) => Promise.resolve(facturasGuardadas.find((f) => f.id === id) ?? null),
        listar: () => Promise.resolve(facturasGuardadas),
    };

    const turnoRepo: ITurnoCajaRepository = {
        buscarAbiertoDeUsuario: (usuarioId: string) =>
            Promise.resolve(opciones.turnosAbiertos?.[usuarioId] ?? null),
        abrir: () => Promise.resolve(makeTurno()),
        findById: () => Promise.resolve(null),
        cerrar: () => Promise.resolve(makeTurno()),
    };

    const clienteRepo: IClienteRepository = {
        findById: (id: string) => Promise.resolve(opciones.clientes?.[id] ?? null),
        findByDocumento: () => Promise.resolve(null),
        buscar: () => Promise.resolve([]),
        crear: () => Promise.resolve(makeCliente()),
        actualizar: () => Promise.resolve(makeCliente()),
    };

    const sucursalRepo: ISucursalOperadorRepository = {
        obtenerSucursalId: () =>
            Promise.resolve(opciones.sucursalId === undefined ? 1 : opciones.sucursalId),
    };

    const useCase = new CrearFacturaUseCase(
        facturaRepo,
        turnoRepo,
        clienteRepo,
        sucursalRepo,
        auditor,
    );

    return { useCase, auditor, facturasGuardadas };
}

Deno.test('CrearFactura: venta en mostrador por cajero con turno abierto emite factura y audita', async () => {
    const cliente = makeCliente('cli-1', 'B2C');
    const { useCase, auditor, facturasGuardadas } = armar({
        turnosAbiertos: { 'usr-cajero-1': makeTurno('turno-1', 'usr-cajero-1') },
        clientes: { 'cli-1': cliente },
        sucursalId: 1,
    });

    // 2 productos a 10,000 c/u = subtotal 20,000. IVA = 0. Total = 20,000.
    const result = await useCase.execute({
        clienteId: 'cli-1',
        items: [
            {
                productoId: crypto.randomUUID(),
                cantidad: 2,
                precioUnitario: 10000,
                descuento: 0,
            },
        ],
        pagos: [
            {
                medioPago: 'efectivo',
                monto: 20000,
            },
        ],
        esB2B: false,
        actor: actorCajeroConTurno,
    });

    assertEquals(result.isSuccess, true);
    assertEquals(result.value.consecutivo, 1);
    assertEquals(result.value.subtotal, 20000);
    assertEquals(result.value.iva, 0);
    assertEquals(result.value.total, 20000);
    assertEquals(result.value.turnoCajaId, 'turno-1');
    assertEquals(facturasGuardadas.length, 1);
    assertEquals(auditor.eventos.length, 1);
    assertEquals(auditor.eventos[0].accion, ACCIONES_AUDITORIA.CREAR);
    assertEquals(auditor.eventos[0].entidad, ENTIDADES_AUDITORIA.FACTURAS);
});

Deno.test('CrearFactura: cajero en mostrador SIN turno abierto falla con FACTURACION_SIN_TURNO_ABIERTO', async () => {
    const cliente = makeCliente('cli-1', 'B2C');
    const { useCase, auditor } = armar({
        turnosAbiertos: { 'usr-cajero-2': null },
        clientes: { 'cli-1': cliente },
        sucursalId: 1,
    });

    const result = await useCase.execute({
        clienteId: 'cli-1',
        items: [
            {
                productoId: crypto.randomUUID(),
                cantidad: 1,
                precioUnitario: 10000,
            },
        ],
        pagos: [
            {
                medioPago: 'efectivo',
                monto: 10000,
            },
        ],
        esB2B: false,
        actor: actorCajeroSinTurno,
    });

    assertEquals(result.isFailure, true);
    assertEquals(result.error.code, 'FACTURACION_SIN_TURNO_ABIERTO');
    assertEquals(auditor.eventos.length, 0);
});

Deno.test('CrearFactura: vendedor-b2b emite venta B2B SIN exigir turno de caja', async () => {
    const clienteB2B = makeCliente('cli-b2b-1', 'B2B', true);
    const { useCase, auditor, facturasGuardadas } = armar({
        turnosAbiertos: {}, // Vendedor no tiene turno
        clientes: { 'cli-b2b-1': clienteB2B },
        sucursalId: 1,
    });

    // 1 producto a 50,000 = total 50,000.
    const result = await useCase.execute({
        clienteId: 'cli-b2b-1',
        items: [
            {
                productoId: crypto.randomUUID(),
                cantidad: 1,
                precioUnitario: 50000,
            },
        ],
        pagos: [
            {
                medioPago: 'credito_corporativo',
                monto: 50000,
            },
        ],
        esB2B: true,
        actor: actorVendedorB2B,
    });

    assertEquals(result.isSuccess, true);
    assertEquals(result.value.total, 50000);
    assertEquals(result.value.turnoCajaId, null); // Sin turno
    assertEquals(facturasGuardadas.length, 1);
    assertEquals(auditor.eventos.length, 1);
});

Deno.test('CrearFactura: rechaza si la suma de pagos no coincide con el total', async () => {
    const cliente = makeCliente('cli-1', 'B2C');
    const { useCase, auditor } = armar({
        turnosAbiertos: { 'usr-cajero-1': makeTurno() },
        clientes: { 'cli-1': cliente },
    });

    const result = await useCase.execute({
        clienteId: 'cli-1',
        items: [
            {
                productoId: crypto.randomUUID(),
                cantidad: 1,
                precioUnitario: 10000, // Total: 10000
            },
        ],
        pagos: [
            {
                medioPago: 'efectivo',
                monto: 5000, // Incompleto
            },
        ],
        esB2B: false,
        actor: actorCajeroConTurno,
    });

    assertEquals(result.isFailure, true);
    assertEquals(result.error.code, 'PAGO_INVALIDO');
    assertEquals(auditor.eventos.length, 0);
});

Deno.test('CrearFactura: rechaza pago a crédito si el cliente no tiene creditoHabilitado', async () => {
    const clienteSinCredito = makeCliente('cli-b2b-2', 'B2B', false);
    const { useCase, auditor } = armar({
        clientes: { 'cli-b2b-2': clienteSinCredito },
    });

    const result = await useCase.execute({
        clienteId: 'cli-b2b-2',
        items: [
            {
                productoId: crypto.randomUUID(),
                cantidad: 1,
                precioUnitario: 10000,
            },
        ],
        pagos: [
            {
                medioPago: 'credito_corporativo',
                monto: 10000,
            },
        ],
        esB2B: true,
        actor: actorVendedorB2B,
    });

    assertEquals(result.isFailure, true);
    assertEquals(result.error.code, 'CREDITO_NO_HABILITADO');
    assertEquals(auditor.eventos.length, 0);
});

Deno.test('CrearFactura: rechaza venta B2B si el cliente es B2C', async () => {
    const clienteB2C = makeCliente('cli-b2c-1', 'B2C');
    const { useCase, auditor } = armar({
        clientes: { 'cli-b2c-1': clienteB2C },
    });

    const result = await useCase.execute({
        clienteId: 'cli-b2c-1',
        items: [
            {
                productoId: crypto.randomUUID(),
                cantidad: 1,
                precioUnitario: 10000,
            },
        ],
        pagos: [
            {
                medioPago: 'transferencia',
                monto: 10000,
            },
        ],
        esB2B: true,
        actor: actorVendedorB2B,
    });

    assertEquals(result.isFailure, true);
    assertEquals(result.error.code, 'CLIENTE_REQUERIDO_B2B');
    assertEquals(auditor.eventos.length, 0);
});
