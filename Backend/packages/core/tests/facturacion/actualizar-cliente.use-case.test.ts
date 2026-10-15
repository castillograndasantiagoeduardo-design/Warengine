import { assertEquals } from 'jsr:@std/assert';
import {
    ACCIONES_AUDITORIA,
    ActorAuditoria,
    ActualizarClienteUseCase,
    Cliente,
    ENTIDADES_AUDITORIA,
    IAuditor,
    IClienteRepository,
} from '../../mod.ts';

class FakeAuditor implements IAuditor {
    public eventos: any[] = [];
    public registrar(evento: any): Promise<void> {
        this.eventos.push(evento);
        return Promise.resolve();
    }
}

const actorCajero: ActorAuditoria = {
    usuarioId: 'usr-cajero-1',
    ip: '127.0.0.1',
    permisos: ['facturacion:gestionar-clientes'],
};

const actorAdmin: ActorAuditoria = {
    usuarioId: 'usr-admin-1',
    ip: '127.0.0.1',
    permisos: ['facturacion:gestionar-clientes', 'inventario:escribir'],
};

function makeCliente(tipo: 'B2C' | 'B2B' = 'B2C', credito = false): Cliente {
    return new Cliente(
        'cli-1',
        'CC',
        '10102020',
        'Empresa Ejemplo SAS',
        tipo,
        'info@ejemplo.com',
        '3001234567',
        'Calle 10 # 20-30',
        credito,
    );
}

function armar(clienteInicial: Cliente | null) {
    let clienteActual = clienteInicial;
    const auditor = new FakeAuditor();
    const repo: IClienteRepository = {
        buscar: () => Promise.resolve([]),
        findByDocumento: () => Promise.resolve(null),
        crear: () => Promise.resolve(makeCliente()),
        findById: (id: string) => Promise.resolve(clienteActual?.id === id ? clienteActual : null),
        actualizar: (id: string, datos) => {
            if (!clienteActual || clienteActual.id !== id) return Promise.resolve(makeCliente());
            clienteActual = new Cliente(
                clienteActual.id,
                clienteActual.tipoDocumento,
                clienteActual.numeroDocumento,
                datos.nombreRazonSocial ?? clienteActual.nombreRazonSocial,
                clienteActual.tipoCliente,
                datos.email !== undefined ? datos.email : clienteActual.email,
                datos.telefono !== undefined ? datos.telefono : clienteActual.telefono,
                datos.direccion !== undefined ? datos.direccion : clienteActual.direccion,
                datos.creditoHabilitado !== undefined ? datos.creditoHabilitado : clienteActual.creditoHabilitado,
            );
            return Promise.resolve(clienteActual);
        },
    };
    const useCase = new ActualizarClienteUseCase(repo, auditor);
    return { useCase, auditor, repo, getCliente: () => clienteActual };
}

Deno.test('ActualizarCliente: cajero puede actualizar datos de contacto y audita', async () => {
    const { useCase, auditor, getCliente } = armar(makeCliente('B2C'));

    const result = await useCase.execute({
        id: 'cli-1',
        telefono: '3119998877',
        direccion: 'Carrera 15 # 45-67',
        actor: actorCajero,
    });

    assertEquals(result.isSuccess, true);
    assertEquals(getCliente()?.telefono, '3119998877');
    assertEquals(getCliente()?.direccion, 'Carrera 15 # 45-67');
    assertEquals(auditor.eventos.length, 1);
    assertEquals(auditor.eventos[0].accion, ACCIONES_AUDITORIA.EDITAR);
    assertEquals(auditor.eventos[0].entidad, ENTIDADES_AUDITORIA.CLIENTES);
});

Deno.test('ActualizarCliente: cajero NO puede modificar creditoHabilitado (403 PERMISO_DENEGADO)', async () => {
    const { useCase, auditor, getCliente } = armar(makeCliente('B2B', false));

    const result = await useCase.execute({
        id: 'cli-1',
        creditoHabilitado: true,
        actor: actorCajero,
    });

    assertEquals(result.isFailure, true);
    assertEquals(result.error.code, 'PERMISO_DENEGADO');
    assertEquals(getCliente()?.creditoHabilitado, false);
    assertEquals(auditor.eventos.length, 0);
});

Deno.test('ActualizarCliente: admin SÍ puede modificar creditoHabilitado', async () => {
    const { useCase, auditor, getCliente } = armar(makeCliente('B2B', false));

    const result = await useCase.execute({
        id: 'cli-1',
        creditoHabilitado: true,
        actor: actorAdmin,
    });

    assertEquals(result.isSuccess, true);
    assertEquals(getCliente()?.creditoHabilitado, true);
    assertEquals(auditor.eventos.length, 1);
});

Deno.test('ActualizarCliente: rechaza B2B con dirección o teléfono vacíos', async () => {
    const { useCase, auditor } = armar(makeCliente('B2B', false));

    const result = await useCase.execute({
        id: 'cli-1',
        direccion: '',
        actor: actorAdmin,
    });

    assertEquals(result.isFailure, true);
    assertEquals(result.error.code, 'CLIENTE_B2B_DATOS_INCOMPLETOS');
    assertEquals(auditor.eventos.length, 0);
});
