import { assertEquals } from '@std/assert';
import {
  ConsultarComparativoInventarioUseCase,
  ConsultarRankingProductosUseCase,
  FiltroComparativoInventario,
  FiltroRankingProductos,
  IMetricasAdminRepository,
  IRolRepository,
  ISucursalesAutorizadasRepository,
  IUsuarioRepository,
  PERMISO_ALCANCE_GLOBAL,
  ResolverAlcanceSucursalUseCase,
  Usuario,
} from '../../mod.ts';

function armarContexto(opciones: { global: boolean; sucursales: number[]; usuarioExiste?: boolean }) {
  const usuario = opciones.usuarioExiste === false
    ? null
    : new Usuario('u-1', 'admin@warengine.local', 'hash', 2, true, false, null);

  const usuarios: IUsuarioRepository = {
    findByEmail: () => Promise.resolve(usuario),
    findById: () => Promise.resolve(usuario),
  };

  const roles: IRolRepository = {
    obtenerPermisosDeRol: () => Promise.resolve(opciones.global ? [PERMISO_ALCANCE_GLOBAL] : ['administracion:gestionar-sucursales']),
  };

  const autorizadas: ISucursalesAutorizadasRepository = {
    obtenerIdsAutorizados: () => Promise.resolve(opciones.sucursales),
  };

  const llamadasRanking: FiltroRankingProductos[] = [];
  const llamadasComparativo: FiltroComparativoInventario[] = [];

  const metricasRepo: IMetricasAdminRepository = {
    obtenerMetricasGanancias: () => Promise.resolve({
      ingresosTotales: 0,
      costoTotal: 0,
      gananciaNeta: 0,
      margenPorcentaje: 0,
      totalFacturas: 0,
      ticketPromedio: 0,
    }),
    obtenerTendenciasVentas: () => Promise.resolve([]),
    obtenerRendimientoSucursales: () => Promise.resolve([]),
    obtenerRankingProductos: (f) => {
      llamadasRanking.push(f);
      return Promise.resolve([
        { productoId: 'prod-1', sku: 'SKU-001', nombre: 'Pintura Blanca', cantidadVendida: 80, totalRecaudado: 1200000, gananciaGenerada: 400000 },
      ]);
    },
    obtenerComparativoInventario: (f) => {
      llamadasComparativo.push(f);
      return Promise.resolve([
        {
          productoId: 'prod-1',
          sku: 'SKU-001',
          nombre: 'Pintura Blanca',
          categoriaNombre: 'Pinturas',
          stockTotal: 15,
          existenciasPorSucursal: [
            { sucursalId: 1, nombreSucursal: 'Sede Central', stockActual: 10, stockMinimo: 5, estadoStock: 'optimo' },
            { sucursalId: 2, nombreSucursal: 'Sede Norte', stockActual: 5, stockMinimo: 10, estadoStock: 'bajo' },
          ],
        },
      ]);
    },
  };

  const resolverAlcance = new ResolverAlcanceSucursalUseCase(usuarios, roles, autorizadas);
  const useCaseRanking = new ConsultarRankingProductosUseCase(resolverAlcance, metricasRepo);
  const useCaseComparativo = new ConsultarComparativoInventarioUseCase(resolverAlcance, metricasRepo);

  return {
    useCaseRanking,
    useCaseComparativo,
    llamadasRanking,
    llamadasComparativo,
  };
}

// ─── Tests RF-ADM-A4: Ranking de Productos ──────────────────────────────────

Deno.test('Ranking: Super Admin consulta productos más vendidos a nivel global', async () => {
  const { useCaseRanking, llamadasRanking } = armarContexto({ global: true, sucursales: [1] });
  const result = await useCaseRanking.execute({ usuarioId: 'u-1', orden: 'mas_vendidos', limite: 5 });

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value.length, 1);
    assertEquals(result.value[0].sku, 'SKU-001');
  }
  assertEquals(llamadasRanking[0].orden, 'mas_vendidos');
  assertEquals(llamadasRanking[0].limite, 5);
  assertEquals(llamadasRanking[0].sucursalId, undefined);
});

Deno.test('Ranking: Admin de sucursal única se acota a su sede asignada', async () => {
  const { useCaseRanking, llamadasRanking } = armarContexto({ global: false, sucursales: [2] });
  const result = await useCaseRanking.execute({ usuarioId: 'u-1', orden: 'menos_vendidos' });

  assertEquals(result.isSuccess, true);
  assertEquals(llamadasRanking[0].sucursalId, 2);
  assertEquals(llamadasRanking[0].orden, 'menos_vendidos');
});

Deno.test('Ranking: rechaza sucursal prohibida para usuario limitado', async () => {
  const { useCaseRanking } = armarContexto({ global: false, sucursales: [2] });
  const result = await useCaseRanking.execute({ usuarioId: 'u-1', orden: 'mas_vendidos', sucursalId: 9 });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'SUCURSAL_FUERA_DE_ALCANCE');
});

Deno.test('Ranking: rechaza rango de fechas con desde posterior a hasta', async () => {
  const { useCaseRanking } = armarContexto({ global: true, sucursales: [1] });
  const result = await useCaseRanking.execute({
    usuarioId: 'u-1',
    orden: 'mas_vendidos',
    desde: new Date('2026-10-20'),
    hasta: new Date('2026-10-10'),
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'RANGO_FECHAS_INVALIDO');
});

// ─── Tests RF-ADM-C4: Comparativo de Inventario entre Sedes ────────────────

Deno.test('Comparativo: Super Admin consulta stock de todas las sucursales', async () => {
  const { useCaseComparativo, llamadasComparativo } = armarContexto({ global: true, sucursales: [1] });
  const result = await useCaseComparativo.execute({ usuarioId: 'u-1' });

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value.length, 1);
    assertEquals(result.value[0].stockTotal, 15);
  }
  assertEquals(llamadasComparativo[0].sucursalIds, undefined);
});

Deno.test('Comparativo: Admin local se acota automáticamente a sus sedes autorizadas', async () => {
  const { useCaseComparativo, llamadasComparativo } = armarContexto({ global: false, sucursales: [1, 2] });
  const result = await useCaseComparativo.execute({ usuarioId: 'u-1', soloConStockBajo: true });

  assertEquals(result.isSuccess, true);
  assertEquals(llamadasComparativo[0].sucursalIds, [1, 2]);
  assertEquals(llamadasComparativo[0].soloConStockBajo, true);
});

Deno.test('Comparativo: rechaza si se especifica una sucursal no autorizada', async () => {
  const { useCaseComparativo } = armarContexto({ global: false, sucursales: [1] });
  const result = await useCaseComparativo.execute({ usuarioId: 'u-1', sucursalIds: [1, 7] });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'SUCURSAL_FUERA_DE_ALCANCE');
});
