import { assertEquals } from 'jsr:@std/assert';
import type {
  ExistenciaSucursalItem,
  FiltroComparativoInventario,
  FiltroMetricasGanancias,
  FiltroRankingProductos,
  FiltroRendimientoSucursales,
  FiltroTendenciasVentas,
  IMetricasAdminRepository,
  ItemComparativoInventario,
  ItemRankingProducto,
  MetricasGanancias,
  PuntoTendenciaVenta,
  RendimientoSucursal,
} from '@warengine/core';

class MockMetricasAdminRepository implements IMetricasAdminRepository {
  public metricasGananciasResponse: MetricasGanancias = {
    ingresosTotales: 1500000,
    costoTotal: 900000,
    gananciaNeta: 600000,
    margenPorcentaje: 40,
    totalFacturas: 50,
    ticketPromedio: 30000,
  };

  public tendenciasResponse: PuntoTendenciaVenta[] = [
    { periodo: '2026-10-10', totalVentas: 500000, totalGanancias: 200000, cantidadFacturas: 15 },
    { periodo: '2026-10-11', totalVentas: 1000000, totalGanancias: 400000, cantidadFacturas: 35 },
  ];

  public rendimientoResponse: RendimientoSucursal[] = [
    { sucursalId: 1, nombreSucursal: 'Sede Principal', totalVentas: 1000000, totalFacturas: 30, ticketPromedio: 33333.33, gananciaNeta: 400000 },
    { sucursalId: 2, nombreSucursal: 'Sede Norte', totalVentas: 500000, totalFacturas: 20, ticketPromedio: 25000, gananciaNeta: 200000 },
  ];

  public rankingResponse: ItemRankingProducto[] = [
    { productoId: 'prod-1', sku: 'SKU-001', nombre: 'Martillo', cantidadVendida: 100, totalRecaudado: 2500000, gananciaGenerada: 1000000 },
  ];

  public comparativoResponse: ItemComparativoInventario[] = [
    {
      productoId: 'prod-1',
      sku: 'SKU-001',
      nombre: 'Martillo',
      categoriaNombre: 'Herramientas',
      stockTotal: 25,
      existenciasPorSucursal: [
        { sucursalId: 1, nombreSucursal: 'Sede Principal', stockActual: 20, stockMinimo: 10, estadoStock: 'optimo' },
        { sucursalId: 2, nombreSucursal: 'Sede Norte', stockActual: 5, stockMinimo: 10, estadoStock: 'bajo' },
      ],
    },
  ];

  public lastFiltroGanancias?: FiltroMetricasGanancias;
  public lastFiltroTendencias?: FiltroTendenciasVentas;
  public lastFiltroRendimiento?: FiltroRendimientoSucursales;
  public lastFiltroRanking?: FiltroRankingProductos;
  public lastFiltroComparativo?: FiltroComparativoInventario;

  obtenerMetricasGanancias(filtro: FiltroMetricasGanancias): Promise<MetricasGanancias> {
    this.lastFiltroGanancias = filtro;
    return Promise.resolve(this.metricasGananciasResponse);
  }

  obtenerTendenciasVentas(filtro: FiltroTendenciasVentas): Promise<PuntoTendenciaVenta[]> {
    this.lastFiltroTendencias = filtro;
    return Promise.resolve(this.tendenciasResponse);
  }

  obtenerRendimientoSucursales(filtro: FiltroRendimientoSucursales): Promise<RendimientoSucursal[]> {
    this.lastFiltroRendimiento = filtro;
    return Promise.resolve(this.rendimientoResponse);
  }

  obtenerRankingProductos(filtro: FiltroRankingProductos): Promise<ItemRankingProducto[]> {
    this.lastFiltroRanking = filtro;
    return Promise.resolve(this.rankingResponse);
  }

  obtenerComparativoInventario(filtro: FiltroComparativoInventario): Promise<ItemComparativoInventario[]> {
    this.lastFiltroComparativo = filtro;
    return Promise.resolve(this.comparativoResponse);
  }
}

Deno.test('IMetricasAdminRepository: calcula y retorna consolidado de métricas financieras', async () => {
  const repo = new MockMetricasAdminRepository();
  const filtro: FiltroMetricasGanancias = { sucursalId: 1, desde: new Date('2026-10-01'), hasta: new Date('2026-10-31') };
  const resultado = await repo.obtenerMetricasGanancias(filtro);

  assertEquals(resultado.ingresosTotales, 1500000);
  assertEquals(resultado.costoTotal, 900000);
  assertEquals(resultado.gananciaNeta, 600000);
  assertEquals(resultado.margenPorcentaje, 40);
  assertEquals(resultado.ticketPromedio, 30000);
  assertEquals(repo.lastFiltroGanancias?.sucursalId, 1);
});

Deno.test('IMetricasAdminRepository: soporta tendencias temporales por día, semana y mes', async () => {
  const repo = new MockMetricasAdminRepository();
  const filtro: FiltroTendenciasVentas = { agrupacion: 'dia', sucursalId: 1 };
  const resultado = await repo.obtenerTendenciasVentas(filtro);

  assertEquals(resultado.length, 2);
  assertEquals(resultado[0].periodo, '2026-10-10');
  assertEquals(resultado[0].totalVentas, 500000);
  assertEquals(repo.lastFiltroTendencias?.agrupacion, 'dia');
});

Deno.test('IMetricasAdminRepository: compara rendimiento de ventas entre sucursales', async () => {
  const repo = new MockMetricasAdminRepository();
  const filtro: FiltroRendimientoSucursales = { sucursalIds: [1, 2] };
  const resultado = await repo.obtenerRendimientoSucursales(filtro);

  assertEquals(resultado.length, 2);
  assertEquals(resultado[0].sucursalId, 1);
  assertEquals(resultado[0].nombreSucursal, 'Sede Principal');
  assertEquals(resultado[1].sucursalId, 2);
  assertEquals(repo.lastFiltroRendimiento?.sucursalIds, [1, 2]);
});

Deno.test('IMetricasAdminRepository: obtiene ranking de productos con rotación y recaudación', async () => {
  const repo = new MockMetricasAdminRepository();
  const filtro: FiltroRankingProductos = { orden: 'mas_vendidos', limite: 5 };
  const resultado = await repo.obtenerRankingProductos(filtro);

  assertEquals(resultado.length, 1);
  assertEquals(resultado[0].sku, 'SKU-001');
  assertEquals(resultado[0].cantidadVendida, 100);
  assertEquals(resultado[0].gananciaGenerada, 1000000);
});

Deno.test('IMetricasAdminRepository: evalúa estados de stock en comparativo multi-sucursal', async () => {
  const repo = new MockMetricasAdminRepository();
  const filtro: FiltroComparativoInventario = { sucursalIds: [1, 2] };
  const resultado = await repo.obtenerComparativoInventario(filtro);

  assertEquals(resultado.length, 1);
  const sedes = resultado[0].existenciasPorSucursal;
  assertEquals(sedes[0].estadoStock, 'optimo');
  assertEquals(sedes[1].estadoStock, 'bajo');
  assertEquals(resultado[0].stockTotal, 25);
});
