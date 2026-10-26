import { assertEquals } from 'jsr:@std/assert@^1';
import {
  ConsultarResumenDashboardUseCase,
  FiltroMetricasGanancias,
  IMetricasAdminRepository,
  IResumenOrganizacionRepository,
  MetricasGanancias,
  ResumenOrganizacion,
} from '../../mod.ts';

class FakeResumenRepository implements IResumenOrganizacionRepository {
  public obtenerResumenOrganizacion(): Promise<ResumenOrganizacion> {
    return Promise.resolve({ totalSucursales: 3, sucursalesActivas: 2, usuariosTotales: 7, usuariosActivos: 6 });
  }
}

class FakeMetricasRepository implements Partial<IMetricasAdminRepository> {
  public ultimoFiltro: FiltroMetricasGanancias | null = null;

  public obtenerMetricasGanancias(filtro: FiltroMetricasGanancias): Promise<MetricasGanancias> {
    this.ultimoFiltro = filtro;
    return Promise.resolve({
      ingresosTotales: 1500000,
      costoTotal: 900000,
      gananciaNeta: 600000,
      margenPorcentaje: 40,
      totalFacturas: 30,
      ticketPromedio: 50000,
    });
  }
}

function crear() {
  const metricas = new FakeMetricasRepository();
  const useCase = new ConsultarResumenDashboardUseCase(
    new FakeResumenRepository(),
    metricas as unknown as IMetricasAdminRepository,
  );
  return { useCase, metricas };
}

Deno.test('RF-SA-I3: Resumen global combina conteos de organización y ventas consolidadas', async () => {
  const { useCase } = crear();
  const result = await useCase.execute();

  assertEquals(result.isSuccess, true);
  assertEquals(result.value, {
    totalSucursales: 3,
    sucursalesActivas: 2,
    usuariosTotales: 7,
    usuariosActivos: 6,
    ventasConsolidadas: 1500000,
    gananciaNeta: 600000,
    totalFacturas: 30,
    ticketPromedio: 50000,
  });
});

Deno.test('RF-SA-I3: Resumen global consulta ventas de todas las sedes (sin sucursalId)', async () => {
  const { useCase, metricas } = crear();
  const desde = new Date('2026-10-01T00:00:00Z');
  const hasta = new Date('2026-10-25T23:59:59Z');
  await useCase.execute({ desde, hasta });

  assertEquals(metricas.ultimoFiltro, { desde, hasta });
});

Deno.test('RF-SA-I3: Resumen global rechaza un rango de fechas invertido', async () => {
  const { useCase } = crear();
  const result = await useCase.execute({
    desde: new Date('2026-10-25T00:00:00Z'),
    hasta: new Date('2026-10-01T00:00:00Z'),
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'RANGO_FECHAS_INVALIDO');
});
