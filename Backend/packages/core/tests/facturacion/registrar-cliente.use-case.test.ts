import { assertEquals } from 'jsr:@std/assert@^1';
import {
    Cliente,
    DatosCliente,
    FiltrosClientes,
    IClienteRepository,
    RegistrarClienteUseCase,
    TipoCliente,
    TipoDocumentoCliente,
    IAuditor,
    EventoAuditoria,
    ActorAuditoria,
    ACCIONES_AUDITORIA,
    ENTIDADES_AUDITORIA,
} from '../../mod.ts';

const actor: ActorAuditoria = { usuarioId: 'usr-cajero-1', ip: '192.168.1.100' };

class FakeAuditor implements IAuditor {
    public eventos: EventoAuditoria[] = [];
    public registrar(evento: EventoAuditoria): Promise<void> {
        this.eventos.push(evento);
        return Promise.resolve();
    }
}

function makeCliente(tipoCliente: TipoCliente = 'B2C'): Cliente {
    return new Cliente('cli-001', 'CC', '1234567890', 'Ana Pérez', tipoCliente, null, null, null, false);
}

function makeRepository(existente: Cliente | null) {
    const creados: DatosCliente[] = [];
    const repo: IClienteRepository = {
        buscar: (_f: FiltrosClientes) => Promise.resolve([]),
        findByDocumento: (_t: TipoDocumentoCliente, _n: string) => Promise.resolve(existente),
        crear: (datos: DatosCliente) => {
            creados.push(datos);
            return Promise.resolve(
                new Cliente(
                    'cli-nuevo',
                    datos.tipoDocumento,
                    datos.numeroDocumento,
                    datos.nombreRazonSocial,
                    datos.tipoCliente,
                    datos.email,
                    datos.telefono,
                    datos.direccion,
                    false,
                ),
            );
        },
    };
    return { repo, creados };
}

Deno.test('RegistrarCliente: reutiliza el cliente si el documento ya existe y NO audita', async () => {
    const { repo, creados } = makeRepository(makeCliente());
    const auditor = new FakeAuditor();
    const result = await new RegistrarClienteUseCase(repo, auditor).execute({
        tipoDocumento: 'CC',
        numeroDocumento: '1234567890',
        nombreRazonSocial: 'Ana Pérez',
        tipoCliente: 'B2C',
        actor,
    });

    assertEquals(result.isSuccess, true);
    assertEquals(result.value.yaExistia, true);
    assertEquals(creados.length, 0);
    assertEquals(auditor.eventos.length, 0);
});

Deno.test('RegistrarCliente: crea un cliente B2C nuevo sin dirección ni teléfono y audita con convención despues', async () => {
    const { repo, creados } = makeRepository(null);
    const auditor = new FakeAuditor();
    const result = await new RegistrarClienteUseCase(repo, auditor).execute({
        tipoDocumento: 'CC',
        numeroDocumento: '9876543210',
        nombreRazonSocial: 'Luis Gómez',
        tipoCliente: 'B2C',
        actor,
    });

    assertEquals(result.isSuccess, true);
    assertEquals(result.value.yaExistia, false);
    assertEquals(creados.length, 1);
    assertEquals(creados[0].email, null);

    assertEquals(auditor.eventos.length, 1);
    assertEquals(auditor.eventos[0].accion, ACCIONES_AUDITORIA.CREAR);
    assertEquals(auditor.eventos[0].entidad, ENTIDADES_AUDITORIA.CLIENTES);
    assertEquals(auditor.eventos[0].entidadId, 'cli-nuevo');
    assertEquals(auditor.eventos[0].actor, actor);
    assertEquals(auditor.eventos[0].detalles, {
        despues: {
            tipoDocumento: 'CC',
            nombreRazonSocial: 'Luis Gómez',
            tipoCliente: 'B2C',
            email: null,
            telefono: null,
            direccion: null,
        },
    });
});

Deno.test('RegistrarCliente: rechaza un B2B sin dirección y NO audita', async () => {
    const { repo, creados } = makeRepository(null);
    const auditor = new FakeAuditor();
    const result = await new RegistrarClienteUseCase(repo, auditor).execute({
        tipoDocumento: 'NIT',
        numeroDocumento: '900123456',
        nombreRazonSocial: 'Ferretería Andina SAS',
        tipoCliente: 'B2B',
        telefono: '3101234567',
        actor,
    });

    assertEquals(result.isFailure, true);
    assertEquals(result.error.code, 'CLIENTE_B2B_DATOS_INCOMPLETOS');
    assertEquals(creados.length, 0);
    assertEquals(auditor.eventos.length, 0);
});