import { assertEquals } from 'jsr:@std/assert';
import {
    AlcanceSucursal,
    ConsultarHistorialTurnosUseCase,
    ITurnoCajaRepository,
    ObtenerCorteTurnoUseCase,
    ResolverAlcanceSucursalUseCase,
} from '../../mod.ts';
import type { TurnoCorteDetalleDto, TurnoHistorialItemDto } from '@warengine/contracts';

class FakeResolverAlcanceSucursal {
    constructor(private readonly sedesPermitidas: number[] = [1]) { }
    public execute(_req: { usuarioId: string }): Promise<any> {
        return Promise.resolve({
            isFailure: false,
            value: AlcanceSucursal.limitado(this.sedesPermitidas),
        });
    }
}

const mockHistorialItem: TurnoHistorialItemDto = {
    id: 'turno-1',
    usuarioId: 'usr-cajero-1',
    cajeroNombre: 'Juan Cajero',
    cajeroEmail: 'cajero@warengine.com',
    sucursalId: 1,
    sucursalNombre: 'Sede Principal',
    cajaNombre: 'Caja 1',
    fondoInicial: 50000,
    fondoFinal: 55000,
    diferencia: 5000,
    fechaApertura: '2026-11-19T08:00:00.000Z',
    fechaCierre: '2026-11-19T16:00:00.000Z',
    tipoCierre: 'normal',
    cerradoPor: null,
    cerradoPorNombre: null,
    motivoCierre: null,
    totalVendido: 120000,
    cantidadVentas: 15,
    efectivoEsperado: 50000,
};

const mockCorteDetalle: TurnoCorteDetalleDto = {
    id: 'turno-1',
    usuarioId: 'usr-cajero-1',
    cajeroNombre: 'Juan Cajero',
    cajeroEmail: 'cajero@warengine.com',
    sucursalId: 1,
    sucursalNombre: 'Sede Principal',
    cajaNombre: 'Caja 1',
    fondoInicial: 50000,
    fondoFinal: 55000,
    diferencia: 5000,
    fechaApertura: '2026-11-19T08:00:00.000Z',
    fechaCierre: '2026-11-19T16:00:00.000Z',
    tipoCierre: 'normal',
    cerradoPor: null,
    cerradoPorNombre: null,
    motivoCierre: null,
    cantidadVentas: 15,
    totalVentas: 120000,
    ventasPorMetodo: {
        efectivo: 70000,
        tarjeta: 30000,
        transferencia: 20000,
        credito_corporativo: 0,
    },
    efectivoEsperado: 120000,
};

Deno.test('ConsultarHistorialTurnos: lista turnos cerrados paginados', async () => {
    const resolver = new FakeResolverAlcanceSucursal([1]) as unknown as ResolverAlcanceSucursalUseCase;
    let filtrosRecibidos: any;

    const repo: ITurnoCajaRepository = {
        buscarAbiertoDeUsuario: () => Promise.resolve(null),
        abrir: () => Promise.resolve(null),
        findById: () => Promise.resolve(null),
        cerrar: () => Promise.resolve(null as any),
        listarHistorial: (filtros) => {
            filtrosRecibidos = filtros;
            return Promise.resolve({
                items: [mockHistorialItem],
                total: 1,
                totalPaginas: 1,
                page: filtros.page ?? 1,
                limite: filtros.limite ?? 20,
            });
        },
    };

    const useCase = new ConsultarHistorialTurnosUseCase(repo, resolver);

    const result = await useCase.execute({
        usuarioIdPeticion: 'usr-admin-1',
        sucursalId: 1,
        page: 1,
        limite: 10,
        tipoCierre: 'normal',
        conDiferencia: true,
    });

    assertEquals(result.isSuccess, true);
    assertEquals(result.value.items.length, 1);
    assertEquals(result.value.total, 1);
    assertEquals(filtrosRecibidos.sucursalIds, [1]);
    assertEquals(filtrosRecibidos.tipoCierre, 'normal');
    assertEquals(filtrosRecibidos.conDiferencia, true);
});

Deno.test('ConsultarHistorialTurnos: falla si solicita sucursal fuera de alcance', async () => {
    const resolver = new FakeResolverAlcanceSucursal([1]) as unknown as ResolverAlcanceSucursalUseCase;
    const repo: ITurnoCajaRepository = {
        buscarAbiertoDeUsuario: () => Promise.resolve(null),
        abrir: () => Promise.resolve(null),
        findById: () => Promise.resolve(null),
        cerrar: () => Promise.resolve(null as any),
    };

    const useCase = new ConsultarHistorialTurnosUseCase(repo, resolver);

    const result = await useCase.execute({
        usuarioIdPeticion: 'usr-admin-1',
        sucursalId: 99, // Fuera del alcance [1]
    });

    assertEquals(result.isFailure, true);
    assertEquals(result.error.code, 'SUCURSAL_FUERA_DE_ALCANCE');
});

Deno.test('ObtenerCorteTurno: obtiene detalle de arqueo por método de pago', async () => {
    const resolver = new FakeResolverAlcanceSucursal([1]) as unknown as ResolverAlcanceSucursalUseCase;
    const repo: ITurnoCajaRepository = {
        buscarAbiertoDeUsuario: () => Promise.resolve(null),
        abrir: () => Promise.resolve(null),
        findById: () => Promise.resolve(null),
        cerrar: () => Promise.resolve(null as any),
        obtenerCorte: (id) => Promise.resolve(id === 'turno-1' ? mockCorteDetalle : null),
    };

    const useCase = new ObtenerCorteTurnoUseCase(repo, resolver);

    const result = await useCase.execute({
        turnoId: 'turno-1',
        usuarioId: 'usr-admin-1',
    });

    assertEquals(result.isSuccess, true);
    assertEquals(result.value.id, 'turno-1');
    assertEquals(result.value.ventasPorMetodo.efectivo, 70000);
    assertEquals(result.value.ventasPorMetodo.tarjeta, 30000);
});

Deno.test('ObtenerCorteTurno: falla si el turno no existe', async () => {
    const resolver = new FakeResolverAlcanceSucursal([1]) as unknown as ResolverAlcanceSucursalUseCase;
    const repo: ITurnoCajaRepository = {
        buscarAbiertoDeUsuario: () => Promise.resolve(null),
        abrir: () => Promise.resolve(null),
        findById: () => Promise.resolve(null),
        cerrar: () => Promise.resolve(null as any),
        obtenerCorte: () => Promise.resolve(null),
    };

    const useCase = new ObtenerCorteTurnoUseCase(repo, resolver);

    const result = await useCase.execute({
        turnoId: 'turno-inexistente',
        usuarioId: 'usr-admin-1',
    });

    assertEquals(result.isFailure, true);
    assertEquals(result.error.code, 'TURNO_NO_ENCONTRADO');
});
