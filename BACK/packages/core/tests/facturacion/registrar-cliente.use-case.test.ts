/**
 * registrar-cliente.use-case.test.ts — Pruebas unitarias de RegistrarClienteUseCase.
 * Repositorio falso en memoria: no se toca la BD.
 */
import { assertEquals } from 'jsr:@std/assert@^1';
import {
    Cliente,
    DatosCliente,
    FiltrosClientes,
    IClienteRepository,
    RegistrarClienteUseCase,
    TipoCliente,
    TipoDocumentoCliente,
} from '../../mod.ts';

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

Deno.test('RegistrarCliente: reutiliza el cliente si el documento ya existe', async () => {
    const { repo, creados } = makeRepository(makeCliente());
    const result = await new RegistrarClienteUseCase(repo).execute({
        tipoDocumento: 'CC',
        numeroDocumento: '1234567890',
        nombreRazonSocial: 'Ana Pérez',
        tipoCliente: 'B2C',
    });

    assertEquals(result.isSuccess, true);
    assertEquals(result.value.yaExistia, true);
    assertEquals(creados.length, 0);
});

Deno.test('RegistrarCliente: crea un cliente B2C nuevo sin dirección ni teléfono', async () => {
    const { repo, creados } = makeRepository(null);
    const result = await new RegistrarClienteUseCase(repo).execute({
        tipoDocumento: 'CC',
        numeroDocumento: '9876543210',
        nombreRazonSocial: 'Luis Gómez',
        tipoCliente: 'B2C',
    });

    assertEquals(result.isSuccess, true);
    assertEquals(result.value.yaExistia, false);
    assertEquals(creados.length, 1);
    assertEquals(creados[0].email, null);
});

Deno.test('RegistrarCliente: rechaza un B2B sin dirección', async () => {
    const { repo, creados } = makeRepository(null);
    const result = await new RegistrarClienteUseCase(repo).execute({
        tipoDocumento: 'NIT',
        numeroDocumento: '900123456',
        nombreRazonSocial: 'Ferretería Andina SAS',
        tipoCliente: 'B2B',
        telefono: '3101234567',
    });

    assertEquals(result.isFailure, true);
    assertEquals(result.error.code, 'CLIENTE_B2B_DATOS_INCOMPLETOS');
    assertEquals(creados.length, 0);
});