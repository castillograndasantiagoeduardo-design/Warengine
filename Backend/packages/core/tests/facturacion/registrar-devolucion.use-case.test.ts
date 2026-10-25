import { assertEquals, assertRejects } from 'jsr:@std/assert';
import {
    ActorAuditoria,
    CantidadDevolucionExcedidaError,
    DevolucionInvalidaError,
    DevolucionVenta,
    Factura,
    FacturaAnuladaError,
    FacturaItem,
    FacturaNoEncontradaError,
    IAuditor,
    IDevolucionVentaRepository,
    IFacturaRepository,
    ISucursalOperadorRepository,
    ItemFacturaNoEncontradoError,
    OperadorSinSucursalError,
    RegistrarDevolucionUseCase,
    ResumenDevueltoItem,
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
    permisos: ['facturacion:devolucion', 'facturacion:consultar'],
};

const actorSuperAdmin: ActorAuditoria = {
    usuarioId: 'usr-super-1',
    ip: '127.0.0.1',
    permisos: ['facturacion:devolucion', 'administracion:ver-metricas-globales'],
};

function makeFactura(
    id = 'fac-1',
    sucursalId = 1,
    estado: 'emitida' | 'anulada' = 'emitida',
): Factura {
    const item1 = FacturaItem.crear('item-1', id, 'prod-1', 4, 10000, 0); // 40,000 subtotal
    const item2 = FacturaItem.crear('item-2', id, 'prod-2', 1, 5000, 500); // 4,500 subtotal
    return new Factura(
        id,
        101,
        'cli-1',
        'usr-cajero-1',
        sucursalId,
        'turno-1',
        44500,
        0,
        44500,
        estado,
        estado === 'anulada' ? 'usr-admin-1' : null,
        new Date(),
        [item1, item2],
        [],
    );
}

function armarContexto(opciones: {
    facturas?: Factura[];
    sucursalOperador?: number | null;
    resumenPrevio?: Map<string, ResumenDevueltoItem>;
}) {
    const auditor = new FakeAuditor();
    const facturas = opciones.facturas ?? [makeFactura()];
    const resumenPrevio = opciones.resumenPrevio ?? new Map<string, ResumenDevueltoItem>();
    const devolucionesRegistradas: DevolucionVenta[][] = [];

    const facturaRepo: IFacturaRepository = {
        obtenerSiguienteConsecutivo: () => Promise.resolve(1),
        crear: () => Promise.reject(new Error('no usado')),
        findById: (id: string) => Promise.resolve(facturas.find((f) => f.id === id) ?? null),
        listar: () => Promise.resolve(facturas),
        anular: () => Promise.reject(new Error('no usado')),
    };

    const devolucionRepo: IDevolucionVentaRepository = {
        registrar: (devoluciones: DevolucionVenta[]) => {
            devolucionesRegistradas.push(devoluciones);
            return Promise.resolve(devoluciones);
        },
        resumenDevueltoPorFactura: (facturaId: string) => {
            return Promise.resolve(resumenPrevio);
        },
        listarPorFactura: (facturaId: string) => {
            return Promise.resolve(devolucionesRegistradas.flat().filter((d) => d.facturaId === facturaId));
        },
    };

    const sucursalRepo: ISucursalOperadorRepository = {
        obtenerSucursalId: (usuarioId: string) => {
            if (opciones.sucursalOperador !== undefined) {
                return Promise.resolve(opciones.sucursalOperador);
            }
            return Promise.resolve(1);
        },
    };

    const useCase = new RegistrarDevolucionUseCase(
        facturaRepo,
        devolucionRepo,
        sucursalRepo,
        auditor,
    );

    return { useCase, auditor, devolucionesRegistradas, facturas };
}

Deno.test('RegistrarDevolucionUseCase: rechaza motivo vacío o menor a 5 caracteres', async () => {
    const { useCase } = armarContexto({});
    const res = await useCase.execute({
        facturaId: 'fac-1',
        motivo: 'abc',
        reingresaStock: true,
        devolverTodo: false,
        items: [{ facturaItemId: 'item-1', cantidad: 1 }],
        actor: actorAdminSucursal,
    });

    assertEquals(res.isFailure, true);
    assertEquals(res.error instanceof DevolucionInvalidaError, true);
    assertEquals(res.error.message, 'El motivo de la devolución es obligatorio.');
});

Deno.test('RegistrarDevolucionUseCase: rechaza si la factura no existe', async () => {
    const { useCase } = armarContexto({});
    const res = await useCase.execute({
        facturaId: 'fac-fantasma',
        motivo: 'Producto con fallas de fábrica',
        reingresaStock: true,
        devolverTodo: false,
        items: [{ facturaItemId: 'item-1', cantidad: 1 }],
        actor: actorAdminSucursal,
    });

    assertEquals(res.isFailure, true);
    assertEquals(res.error instanceof FacturaNoEncontradaError, true);
});

Deno.test('RegistrarDevolucionUseCase: rechaza si operador local no pertenece a la sucursal de la factura', async () => {
    const { useCase } = armarContexto({ sucursalOperador: 2 }); // Factura es sucursal 1
    const res = await useCase.execute({
        facturaId: 'fac-1',
        motivo: 'Devolución en otra sede no permitida',
        reingresaStock: true,
        devolverTodo: false,
        items: [{ facturaItemId: 'item-1', cantidad: 1 }],
        actor: actorAdminSucursal,
    });

    assertEquals(res.isFailure, true);
    assertEquals(res.error instanceof FacturaNoEncontradaError, true);
});

Deno.test('RegistrarDevolucionUseCase: rechaza si operador local no tiene sucursal asignada', async () => {
    const { useCase } = armarContexto({ sucursalOperador: null });
    const res = await useCase.execute({
        facturaId: 'fac-1',
        motivo: 'Devolución operador sin sucursal',
        reingresaStock: true,
        devolverTodo: false,
        items: [{ facturaItemId: 'item-1', cantidad: 1 }],
        actor: actorAdminSucursal,
    });

    assertEquals(res.isFailure, true);
    assertEquals(res.error instanceof OperadorSinSucursalError, true);
});

Deno.test('RegistrarDevolucionUseCase: Super Admin con ADMIN_VER_METRICAS_GLOBALES puede devolver sin importar sucursal', async () => {
    const { useCase, auditor, devolucionesRegistradas } = armarContexto({ sucursalOperador: null });
    const res = await useCase.execute({
        facturaId: 'fac-1',
        motivo: 'Devolución autorizada por Super Admin',
        reingresaStock: true,
        devolverTodo: false,
        items: [{ facturaItemId: 'item-1', cantidad: 1 }],
        actor: actorSuperAdmin,
    });

    assertEquals(res.isSuccess, true);
    assertEquals(devolucionesRegistradas.length, 1);
    assertEquals(devolucionesRegistradas[0][0].cantidad, 1);
    assertEquals(devolucionesRegistradas[0][0].montoReembolso, 10000);
    assertEquals(auditor.eventos.length, 1);
    assertEquals(auditor.eventos[0].entidad, 'devoluciones_ventas');
});

Deno.test('RegistrarDevolucionUseCase: rechaza devolución sobre factura anulada', async () => {
    const facturaAnulada = makeFactura('fac-1', 1, 'anulada');
    const { useCase } = armarContexto({ facturas: [facturaAnulada] });
    const res = await useCase.execute({
        facturaId: 'fac-1',
        motivo: 'Intento de devolución en factura anulada',
        reingresaStock: true,
        devolverTodo: false,
        items: [{ facturaItemId: 'item-1', cantidad: 1 }],
        actor: actorAdminSucursal,
    });

    assertEquals(res.isFailure, true);
    assertEquals(res.error instanceof FacturaAnuladaError, true);
});

Deno.test('RegistrarDevolucionUseCase: rechaza si el facturaItemId no pertenece a la factura', async () => {
    const { useCase } = armarContexto({});
    const res = await useCase.execute({
        facturaId: 'fac-1',
        motivo: 'Producto equivocado en la solicitud',
        reingresaStock: true,
        devolverTodo: false,
        items: [{ facturaItemId: 'item-ajeno-uuid', cantidad: 1 }],
        actor: actorAdminSucursal,
    });

    assertEquals(res.isFailure, true);
    assertEquals(res.error instanceof ItemFacturaNoEncontradoError, true);
});

Deno.test('RegistrarDevolucionUseCase: rechaza cantidad mayor a la disponible en la línea (exceso)', async () => {
    const { useCase } = armarContexto({});
    // item-1 tiene cantidad vendida = 4
    const res = await useCase.execute({
        facturaId: 'fac-1',
        motivo: 'Devolución de 5 unidades cuando se vendieron 4',
        reingresaStock: true,
        devolverTodo: false,
        items: [{ facturaItemId: 'item-1', cantidad: 5 }],
        actor: actorAdminSucursal,
    });

    assertEquals(res.isFailure, true);
    assertEquals(res.error instanceof CantidadDevolucionExcedidaError, true);
});

Deno.test('RegistrarDevolucionUseCase: devolución parcial exitosa con cálculo de reembolso y auditoría', async () => {
    const { useCase, auditor, devolucionesRegistradas } = armarContexto({});
    const res = await useCase.execute({
        facturaId: 'fac-1',
        motivo: 'Producto defectuoso reportado por cliente',
        reingresaStock: true,
        devolverTodo: false,
        items: [{ facturaItemId: 'item-1', cantidad: 1 }],
        actor: actorAdminSucursal,
    });

    assertEquals(res.isSuccess, true);
    const devs = res.value;
    assertEquals(devs.length, 1);
    assertEquals(devs[0].cantidad, 1);
    assertEquals(devs[0].montoReembolso, 10000);
    assertEquals(devs[0].reingresaStock, true);
    assertEquals(devs[0].sucursalId, 1);

    assertEquals(auditor.eventos.length, 1);
    assertEquals(auditor.eventos[0].accion, 'crear');
    assertEquals(auditor.eventos[0].entidad, 'devoluciones_ventas');
    assertEquals(auditor.eventos[0].detalles.despues.tipo, 'parcial');
    assertEquals(auditor.eventos[0].detalles.despues.totalReembolso, 10000);
});

Deno.test('RegistrarDevolucionUseCase: segunda devolución que completa la línea ajusta el remanente exacto', async () => {
    // item-1 vendió 4 unidades a subtotal 40000 (10000 c/u).
    // Previamente se devolvió 1 unidad por 10000. Quedan 3 unidades y 30000.
    const previo = new Map<string, ResumenDevueltoItem>([
        ['item-1', { cantidad: 1, monto: 10000 }],
    ]);
    const { useCase } = armarContexto({ resumenPrevio: previo });

    const res = await useCase.execute({
        facturaId: 'fac-1',
        motivo: 'Devolución de las 3 unidades restantes',
        reingresaStock: false,
        devolverTodo: false,
        items: [{ facturaItemId: 'item-1', cantidad: 3 }],
        actor: actorAdminSucursal,
    });

    assertEquals(res.isSuccess, true);
    const devs = res.value;
    assertEquals(devs.length, 1);
    assertEquals(devs[0].cantidad, 3);
    assertEquals(devs[0].montoReembolso, 30000); // 40000 - 10000 = 30000 exacto
    assertEquals(devs[0].reingresaStock, false);
});

Deno.test('RegistrarDevolucionUseCase: devolverTodo devuelve el remanente completo de todas las líneas', async () => {
    // item-1 tiene 4 (vendido), item-2 tiene 1 (vendido).
    // Supongamos que item-1 ya devolvió 1 unidad previamente.
    const previo = new Map<string, ResumenDevueltoItem>([
        ['item-1', { cantidad: 1, monto: 10000 }],
    ]);
    const { useCase, auditor } = armarContexto({ resumenPrevio: previo });

    const res = await useCase.execute({
        facturaId: 'fac-1',
        motivo: 'Cliente revoca compra completa por inconformidad',
        reingresaStock: true,
        devolverTodo: true,
        items: [],
        actor: actorAdminSucursal,
    });

    assertEquals(res.isSuccess, true);
    const devs = res.value;
    assertEquals(devs.length, 2);
    // item-1 devuelve las 3 restantes: 30000
    // item-2 devuelve 1 completa: 4500
    const devItem1 = devs.find((d) => d.facturaItemId === 'item-1')!;
    const devItem2 = devs.find((d) => d.facturaItemId === 'item-2')!;
    assertEquals(devItem1.cantidad, 3);
    assertEquals(devItem1.montoReembolso, 30000);
    assertEquals(devItem2.cantidad, 1);
    assertEquals(devItem2.montoReembolso, 4500);

    assertEquals(auditor.eventos.length, 1);
    assertEquals(auditor.eventos[0].detalles.despues.tipo, 'total');
    assertEquals(auditor.eventos[0].detalles.despues.totalReembolso, 34500);
});

Deno.test('RegistrarDevolucionUseCase: rechaza devolverTodo si la factura ya fue devuelta por completo', async () => {
    const previo = new Map<string, ResumenDevueltoItem>([
        ['item-1', { cantidad: 4, monto: 40000 }],
        ['item-2', { cantidad: 1, monto: 4500 }],
    ]);
    const { useCase } = armarContexto({ resumenPrevio: previo });

    const res = await useCase.execute({
        facturaId: 'fac-1',
        motivo: 'Devolución total sobre factura ya devuelta',
        reingresaStock: true,
        devolverTodo: true,
        items: [],
        actor: actorAdminSucursal,
    });

    assertEquals(res.isFailure, true);
    assertEquals(res.error instanceof CantidadDevolucionExcedidaError, true);
    assertEquals(res.error.message, 'La factura ya fue devuelta por completo.');
});
