import { assertEquals } from 'jsr:@std/assert';
import {
    BuscarClientesUseCase,
    Cliente,
    ClientesPaginadosResultado,
    FiltrosClientes,
    FiltrosClientesPaginado,
    IClienteRepository,
} from '../../mod.ts';

function makeCliente(id: string, nombre: string, doc: string, tipo: 'B2C' | 'B2B', credito: boolean, saldo = 0): Cliente {
    return new Cliente(
        id,
        tipo === 'B2B' ? 'NIT' : 'CC',
        doc,
        nombre,
        tipo,
        `${id}@empresa.com`,
        '3001234567',
        'Calle 100 # 20-30',
        credito,
        null,
        null,
        30,
        0,
        0,
        0,
        null,
        'sin_solicitud',
        null,
        null,
        null,
        null,
        saldo,
        1500000,
    );
}

class FakeClienteRepository implements IClienteRepository {
    public clientes: Cliente[] = [
        makeCliente('cli-1', 'Acme Corp', '900123456-1', 'B2B', true, 500000),
        makeCliente('cli-2', 'Consumidor Final', '222222222222', 'B2C', false, 0),
        makeCliente('cli-3', 'Beta Solutions', '900987654-2', 'B2B', false, 0),
        makeCliente('cli-4', 'Carlos Pérez', '1012345678', 'B2C', true, 200000),
    ];

    public ultimosFiltrosPaginados?: FiltrosClientesPaginado;
    public ultimosFiltrosSimples?: FiltrosClientes;

    public buscar(filtros: FiltrosClientes): Promise<Cliente[]> {
        this.ultimosFiltrosSimples = filtros;
        let resultado = [...this.clientes];
        if (filtros.texto) {
            const t = filtros.texto.toLowerCase();
            resultado = resultado.filter(
                (c) => c.nombreRazonSocial.toLowerCase().includes(t) || c.numeroDocumento.includes(t),
            );
        }
        if (filtros.tipoDocumento) {
            resultado = resultado.filter((c) => c.tipoDocumento === filtros.tipoDocumento);
        }
        return Promise.resolve(resultado.slice(0, filtros.limite));
    }

    public buscarPaginado(filtros: FiltrosClientesPaginado): Promise<ClientesPaginadosResultado> {
        this.ultimosFiltrosPaginados = filtros;
        let filtrados = [...this.clientes];

        if (filtros.texto) {
            const t = filtros.texto.toLowerCase();
            filtrados = filtrados.filter(
                (c) =>
                    c.nombreRazonSocial.toLowerCase().includes(t) ||
                    c.numeroDocumento.includes(t) ||
                    c.email?.toLowerCase().includes(t),
            );
        }
        if (filtros.tipoCliente) {
            filtrados = filtrados.filter((c) => c.tipoCliente === filtros.tipoCliente);
        }
        if (filtros.creditoHabilitado !== undefined) {
            filtrados = filtrados.filter((c) => c.creditoHabilitado === filtros.creditoHabilitado);
        }

        const total = filtrados.length;
        const totalPaginas = Math.max(1, Math.ceil(total / filtros.limite));
        const items = filtrados.slice(filtros.offset, filtros.offset + filtros.limite);

        const resumen = {
            total: this.clientes.length,
            b2b: this.clientes.filter((c) => c.tipoCliente === 'B2B').length,
            b2c: this.clientes.filter((c) => c.tipoCliente === 'B2C').length,
            conCredito: this.clientes.filter((c) => c.creditoHabilitado).length,
            saldoPendienteTotal: this.clientes.reduce((acc, c) => acc + (c.saldoPendiente ?? 0), 0),
        };

        return Promise.resolve({
            items,
            total,
            totalPaginas,
            page: filtros.page,
            limite: filtros.limite,
            resumen,
        });
    }

    public findByDocumento(_tipo: any, _num: string): Promise<Cliente | null> {
        return Promise.resolve(null);
    }
    public findById(id: string): Promise<Cliente | null> {
        return Promise.resolve(this.clientes.find((c) => c.id === id) ?? null);
    }
    public crear(datos: any): Promise<Cliente> {
        return Promise.resolve(makeCliente('nuevo', datos.nombreRazonSocial, datos.numeroDocumento, datos.tipoCliente, false));
    }
    public actualizar(id: string, _datos: any): Promise<Cliente> {
        return Promise.resolve(this.clientes.find((c) => c.id === id) ?? makeCliente('dummy', 'Dummy', '1', 'B2C', false));
    }
}

Deno.test('BuscarClientesUseCase: búsqueda simple sin paginación devuelve lista simple de clientes', async () => {
    const repo = new FakeClienteRepository();
    const useCase = new BuscarClientesUseCase(repo);

    const result = await useCase.execute({ texto: 'Acme', limite: 10 });
    assertEquals(result.isSuccess, true);
    if (!result.isSuccess) return;

    assertEquals(Array.isArray(result.value), true);
    const lista = result.value as Cliente[];
    assertEquals(lista.length, 1);
    assertEquals(lista[0].nombreRazonSocial, 'Acme Corp');
    assertEquals(repo.ultimosFiltrosSimples?.texto, 'Acme');
});

Deno.test('BuscarClientesUseCase: búsqueda paginada devuelve items, totales, paginación y resumen global', async () => {
    const repo = new FakeClienteRepository();
    const useCase = new BuscarClientesUseCase(repo);

    const result = await useCase.execute({
        page: 1,
        limite: 2,
    });
    assertEquals(result.isSuccess, true);
    if (!result.isSuccess) return;

    assertEquals(Array.isArray(result.value), false);
    const paginado = result.value as ClientesPaginadosResultado;
    assertEquals(paginado.items.length, 2);
    assertEquals(paginado.total, 4);
    assertEquals(paginado.totalPaginas, 2);
    assertEquals(paginado.page, 1);
    assertEquals(paginado.limite, 2);

    // Verificación de contadores de resumen
    assertEquals(paginado.resumen.total, 4);
    assertEquals(paginado.resumen.b2b, 2);
    assertEquals(paginado.resumen.b2c, 2);
    assertEquals(paginado.resumen.conCredito, 2);
    assertEquals(paginado.resumen.saldoPendienteTotal, 700000);
});

Deno.test('BuscarClientesUseCase: filtra por tipoCliente y creditoHabilitado', async () => {
    const repo = new FakeClienteRepository();
    const useCase = new BuscarClientesUseCase(repo);

    const result = await useCase.execute({
        page: 1,
        limite: 10,
        tipoCliente: 'B2B',
        creditoHabilitado: true,
    });
    assertEquals(result.isSuccess, true);
    if (!result.isSuccess) return;

    const paginado = result.value as ClientesPaginadosResultado;
    assertEquals(paginado.items.length, 1);
    assertEquals(paginado.items[0].nombreRazonSocial, 'Acme Corp');
    assertEquals(paginado.items[0].esB2B, true);
    assertEquals(paginado.items[0].puedePagarConCredito, true);
});
