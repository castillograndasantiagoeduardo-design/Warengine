import { assertEquals } from 'jsr:@std/assert';
import {
  ConsultarMetricasGananciasUseCase,
  ConsultarTendenciasVentasUseCase,
  ConsultarRendimientoSucursalesUseCase,
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

  const llamadasGanancias: unknown[] = [];
  const llamadasTendencias: unknown[] = [];
  const llamadasRendimiento: unknown[] = [];

  const metricasRepo: IMetricasAdminRepository = {
    obtenerMetricasGanancias: (f) => {
      llamadasGanancias.push(f);
      return Promise.resolve({
        ingresosTotales: 1000000,
        costoTotal: 600000,
        gananciaNeta: 400000,
        margenPorcentaje: 40,
        totalFacturas: 25,
        ticketPromedio: 40000,
      });
    },
    obtenerTendenciasVentas: (f) => {
      llamadasTendencias.push(f);
      return Promise.resolve([
        { periodo: '2026-10-01', totalVentas: 500000, totalGanancias: 200000, cantidadFacturas: 12 },
      ]);
    },
    obtenerRendimientoSucursales: (f) => {
      llamadasRendimiento.push(f);
      return Promise.resolve([
        { sucursalId: 1, nombreSucursal: 'Sede Central', totalVentas: 800000, totalFacturas: 20, ticketPromedio: 40000, gananciaNeta: 300000 },
      ]);
    },
    obtenerRankingProductos: () => Promise.resolve([]),
    obtenerComparativoInventario: () => Promise.resolve([]),
  };

  const resolverAlcance = new ResolverAlcanceSucursalUseCase(usuarios, roles, autorizadas);
  const useCaseGanancias = new ConsultarMetricasGananciasUseCase(resolverAlcance, metricasRepo);
  const useCaseTendencias = new ConsultarTendenciasVentasUseCase(resolverAlcance, metricasRepo);
  const useCaseRendimiento = new ConsultarRendimientoSucursalesUseCase(resolverAlcance, metricasRepo);

  return {
    useCaseGanancias,
    useCaseTendencias,
    useCaseRendimiento,
    llamadasGanancias,
    llamadasTendencias,
    llamadasRendimiento,
  };
}

// ─── Tests RF-ADM-A1: Métricas de Ganancias ─────────────────────────────────

Deno.test('Ganancias: Super Admin consulta consolidado global sin filtro de sede', async () => {
  const { useCaseGanancias, llamadasGanancias } = armarContexto({ global: true, sucursales: [1] });
  const result = await useCaseGanancias.execute({ usuarioId: 'u-1' });

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value.ingresosTotales, 1000000);
    assertEquals(result.value.gananciaNeta, 400000);
  }
  assertEquals((llamadasGanancias[0] as { sucursalId?: number }).sucursalId, undefined);
});

Deno.test('Ganancias: Super Admin puede filtrar por cualquier sucursal', async () => {
  const { useCaseGanancias, llamadasGanancias } = armarContexto({ global: true, sucursales: [1] });
  const result = await useCaseGanancias.execute({ usuarioId: 'u-1', sucursalId: 5 });

  assertEquals(result.isSuccess, true);
  assertEquals((llamadasGanancias[0] as { sucursalId?: number }).sucursalId, 5);
});

Deno.test('Ganancias: Admin con sede única asignada filtra automáticamente por ella', async () => {
  const { useCaseGanancias, llamadasGanancias } = armarContexto({ global: false, sucursales: [2] });
  const result = await useCaseGanancias.execute({ usuarioId: 'u-1' });

  assertEquals(result.isSuccess, true);
  assertEquals((llamadasGanancias[0] as { sucursalId?: number }).sucursalId, 2);
});

Deno.test('Ganancias: Admin no puede consultar una sucursal fuera de su alcance', async () => {
  const { useCaseGanancias } = armarContexto({ global: false, sucursales: [2] });
  const result = await useCaseGanancias.execute({ usuarioId: 'u-1', sucursalId: 99 });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'SUCURSAL_FUERA_DE_ALCANCE');
});

Deno.test('Ganancias: falla con RangoFechasInvalidoError si desde es posterior a hasta', async () => {
  const { useCaseGanancias } = armarContexto({ global: true, sucursales: [1] });
  const result = await useCaseGanancias.execute({
    usuarioId: 'u-1',
    desde: new Date('2026-10-31'),
    hasta: new Date('2026-10-01'),
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'RANGO_FECHAS_INVALIDO');
});

// ─── Tests RF-ADM-A2: Tendencias de Ventas ──────────────────────────────────

Deno.test('Tendencias: consulta agregación por día, semana o mes', async () => {
  const { useCaseTendencias, llamadasTendencias } = armarContexto({ global: true, sucursales: [1] });
  const result = await useCaseTendencias.execute({ usuarioId: 'u-1', agrupacion: 'mes' });

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value.length, 1);
    assertEquals(result.value[0].periodo, '2026-10-01');
  }
  assertEquals((llamadasTendencias[0] as { agrupacion: string }).agrupacion, 'mes');
});

Deno.test('Tendencias: rechaza sucursal fuera de alcance para administrador local', async () => {
  const { useCaseTendencias } = armarContexto({ global: false, sucursales: [1] });
  const result = await useCaseTendencias.execute({ usuarioId: 'u-1', agrupacion: 'dia', sucursalId: 8 });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'SUCURSAL_FUERA_DE_ALCANCE');
});

// ─── Tests RF-ADM-A3: Rendimiento entre Sucursales ──────────────────────────

Deno.test('Rendimiento: Super Admin compara volumen de ventas entre todas las sedes', async () => {
  const { useCaseRendimiento, llamadasRendimiento } = armarContexto({ global: true, sucursales: [1] });
  const result = await useCaseRendimiento.execute({ usuarioId: 'u-1' });

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value.length, 1);
    assertEquals(result.value[0].nombreSucursal, 'Sede Central');
  }
  assertEquals((llamadasRendimiento[0] as { sucursalIds?: number[] }).sucursalIds, undefined);
});

Deno.test('Rendimiento: Admin local solo compara sus sucursales asignadas', async () => {
  const { useCaseRendimiento, llamadasRendimiento } = armarContexto({ global: false, sucursales: [1, 2] });
  const result = await useCaseRendimiento.execute({ usuarioId: 'u-1' });

  assertEquals(result.isSuccess, true);
  assertEquals((llamadasRendimiento[0] as { sucursalIds?: number[] }).sucursalIds, [1, 2]);
});

Deno.test('Rendimiento: rechaza si se pide explícitamente una sucursal prohibida', async () => {
  const { useCaseRendimiento } = armarContexto({ global: false, sucursales: [1, 2] });
  const result = await useCaseRendimiento.execute({ usuarioId: 'u-1', sucursalIds: [1, 5] });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'SUCURSAL_FUERA_DE_ALCANCE');
});

// ─── RNF-ADM-04: usuario limitado con varias sedes ─────────────────────────

Deno.test('Ganancias y tendencias: usuario con varias sedes debe indicar sucursalId (no ve datos globales)', async () => {
  const { useCaseGanancias, useCaseTendencias, llamadasGanancias, llamadasTendencias } = armarContexto({
    global: false,
    sucursales: [2, 3],
  });

  const ganancias = await useCaseGanancias.execute({ usuarioId: 'u-1' });
  const tendencias = await useCaseTendencias.execute({ usuarioId: 'u-1', agrupacion: 'dia' });

  assertEquals(ganancias.isFailure, true);
  assertEquals(ganancias.error.code, 'SUCURSAL_REQUERIDA');
  assertEquals(tendencias.isFailure, true);
  assertEquals(tendencias.error.code, 'SUCURSAL_REQUERIDA');
  assertEquals(llamadasGanancias.length, 0);
  assertEquals(llamadasTendencias.length, 0);

  const conSede = await useCaseGanancias.execute({ usuarioId: 'u-1', sucursalId: 3 });
  assertEquals(conSede.isSuccess, true);
  assertEquals((llamadasGanancias[0] as { sucursalId?: number }).sucursalId, 3);
});
