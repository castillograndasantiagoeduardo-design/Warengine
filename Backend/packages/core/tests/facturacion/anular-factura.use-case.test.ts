import { assertEquals } from 'jsr:@std/assert';
import {
    ActorAuditoria,
    AnularFacturaUseCase,
    Factura,
    FacturaItem,
    IAuditor,
    IFacturaRepository,
    ISucursalOperadorRepository,
} from '../../mod.ts';

class FakeAuditor implements IAuditor {
    public eventos: any[] = [];
    public registrar(evento: any): Promise<void> {
        this.eventos.push(evento);
        return Promise.resolve();
    }
}

const actorAdminSucursal: ActorAuditoria = {
    usuarioId: 'usr-admin-1',
    ip: '127.0.0.1',
    permisos: ['facturacion:anular', 'facturacion:consultar'],
};

const actorSuperAdmin: ActorAuditoria = {
    usuarioId: 'usr-super-1',
    ip: '127.0.0.1',
    permisos: ['facturacion:anular', 'administracion:ver-metricas-globales'],
};

function makeFactura(id = 'fac-1', sucursalId = 1, estado: 'emitida' | 'anulada' = 'emitida'): Factura {
    const item = FacturaItem.crear('item-1', id, 'prod-1', 2, 10000, 0);
    return new Factura(
        id,
        7,
        'cli-1',
        'usr-cajero-1',
        sucursalId,
        'turno-1',
        20000,
        0,
        20000,
        estado,
        estado === 'anulada' ? 'usr-admin-1' : null,
        new Date(),
        [item],
        [],
    );
}

function armar(opciones: {
    facturas?: Factura[];
    sucursalOperador?: number | null;
    anularDevuelveNull?: boolean;
}) {
    const auditor = new FakeAuditor();
    const facturas = opciones.facturas ?? [];
    const llamadasAnular: { id: string; anuladaPor: string }[] = [];

    const facturaRepo: IFacturaRepository = {
        obtenerSiguienteConsecutivo: () => Promise.resolve(1),
        crear: () => Promise.reject(new Error('no usado')),
        findById: (id: string) => Promise.resolve(facturas.find((f) => f.id === id) ?? null),
        listar: () => Promise.resolve(facturas),
        anular: (id: string, anuladaPor: string) => {
            llamadasAnular.push({ id, anuladaPor });
            if (opciones.anularDevuelveNull) return Promise.resolve(null);
            const original = facturas.find((f) => f.id === id)!;
            return Promise.resolve(
                new Factura(
                    original.id,
                    original.consecutivo,
                    original.clienteId,
                    original.usuarioId,
                    original.sucursalId,
                    original.turnoCajaId,
                    original.subtotal,
                    original.iva,
                    original.total,
                    'anulada',
                    anuladaPor,
                    original.fecha,
                    original.items,
                    original.pagos,
                ),
            );
        },
    };

    const sucursalRepo: ISucursalOperadorRepository = {
        obtenerSucursalId: () =>
            Promise.resolve(opciones.sucursalOperador === undefined ? 1 : opciones.sucursalOperador),
    };

    const useCase = new AnularFacturaUseCase(facturaRepo, sucursalRepo, auditor);
    return { useCase, auditor, llamadasAnular };
}

// Caso 1
Deno.test('AnularFactura: rechaza motivo vacío o demasiado corto sin tocar el repositorio', async () => {
    const { useCase, llamadasAnular, auditor } = armar({ facturas: [makeFactura()] });

    for (const motivo of ['', '   ', 'abc']) {
        const result = await useCase.execute({ id: 'fac-1', motivo, actor: actorAdminSucursal });
        assertEquals(result.isFailure, true);
        if (result.isFailure) assertEquals(result.error.code, 'MOTIVO_ANULACION_FACTURA_REQUERIDO');
    }
    assertEquals(llamadasAnular.length, 0);
    assertEquals(auditor.eventos.length, 0);
});

// Caso 2
Deno.test('AnularFactura: factura inexistente devuelve FACTURA_NO_ENCONTRADA', async () => {
    const { useCase } = armar({ facturas: [] });
    const result = await useCase.execute({ id: 'no-existe', motivo: 'Error de digitación', actor: actorAdminSucursal });
    assertEquals(result.isFailure, true);
    if (result.isFailure) assertEquals(result.error.code, 'FACTURA_NO_ENCONTRADA');
});

// Caso 3
Deno.test('AnularFactura: factura de otra sede se oculta como no encontrada', async () => {
    const { useCase, llamadasAnular } = armar({
        facturas: [makeFactura('fac-1', 2)],
        sucursalOperador: 1,
    });
    const result = await useCase.execute({ id: 'fac-1', motivo: 'Error de digitación', actor: actorAdminSucursal });
    assertEquals(result.isFailure, true);
    if (result.isFailure) assertEquals(result.error.code, 'FACTURA_NO_ENCONTRADA');
    assertEquals(llamadasAnular.length, 0);
});

// Caso 4
Deno.test('AnularFactura: operador sin sucursal asignada es rechazado', async () => {
    const { useCase, llamadasAnular } = armar({ facturas: [makeFactura()], sucursalOperador: null });
    const result = await useCase.execute({ id: 'fac-1', motivo: 'Error de digitación', actor: actorAdminSucursal });
    assertEquals(result.isFailure, true);
    if (result.isFailure) assertEquals(result.error.code, 'OPERADOR_SIN_SUCURSAL');
});

// Caso 5
Deno.test('AnularFactura: una factura ya anulada devuelve FACTURA_YA_ANULADA', async () => {
    const { useCase, llamadasAnular } = armar({ facturas: [makeFactura('fac-1', 1, 'anulada')] });
    const result = await useCase.execute({ id: 'fac-1', motivo: 'Error de digitación', actor: actorAdminSucursal });
    assertEquals(result.isFailure, true);
    if (result.isFailure) assertEquals(result.error.code, 'FACTURA_YA_ANULADA');
    assertEquals(llamadasAnular.length, 0);
});

// Caso 6
Deno.test('AnularFactura: si otra petición anuló primero (repo devuelve null) responde FACTURA_YA_ANULADA sin auditar', async () => {
    const { useCase, auditor } = armar({ facturas: [makeFactura()], anularDevuelveNull: true });
    const result = await useCase.execute({ id: 'fac-1', motivo: 'Error de digitación', actor: actorAdminSucursal });
    assertEquals(result.isFailure, true);
    if (result.isFailure) assertEquals(result.error.code, 'FACTURA_YA_ANULADA');
    assertEquals(auditor.eventos.length, 0);
});

// Caso 7
Deno.test('AnularFactura: anulación exitosa registra anulada_por, limpia el motivo y audita', async () => {
    const { useCase, auditor, llamadasAnular } = armar({ facturas: [makeFactura()] });
    const result = await useCase.execute({
        id: 'fac-1',
        motivo: '  Cliente se arrepintió de la compra  ',
        actor: actorAdminSucursal,
    });

    assertEquals(result.isSuccess, true);
    if (result.isSuccess) {
        assertEquals(result.value.estado, 'anulada');
        assertEquals(result.value.anuladaPor, 'usr-admin-1');
    }
    assertEquals(llamadasAnular, [{ id: 'fac-1', anuladaPor: 'usr-admin-1' }]);

    assertEquals(auditor.eventos.length, 1);
    const evento = auditor.eventos[0];
    assertEquals(evento.accion, 'anular');
    assertEquals(evento.entidad, 'facturas');
    assertEquals(evento.entidadId, 'fac-1');
    assertEquals(evento.detalles.motivo, 'Cliente se arrepintió de la compra');
    assertEquals(evento.detalles.antes, { estado: 'emitida' });
});

// Caso 8
Deno.test('AnularFactura: un actor global puede anular facturas de cualquier sede', async () => {
    const { useCase, llamadasAnular } = armar({
        facturas: [makeFactura('fac-9', 3)],
        sucursalOperador: 1,
    });
    const result = await useCase.execute({ id: 'fac-9', motivo: 'Venta duplicada por error', actor: actorSuperAdmin });
    assertEquals(result.isSuccess, true);
    assertEquals(llamadasAnular.length, 1);
});
