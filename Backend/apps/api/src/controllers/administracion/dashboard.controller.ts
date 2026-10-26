import {
  comparativoInventarioQuerySchema,
  metricasGananciasQuerySchema,
  rankingProductosQuerySchema,
  rendimientoSucursalesQuerySchema,
  resumenDashboardQuerySchema,
  tendenciasVentasQuerySchema,
} from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { safeHandler } from '../../utils/handler.ts';
import { obtenerIdentidad } from '../../utils/identidad.ts';

export function consultarMetricasGananciasController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = metricasGananciasQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    return presentResult(
      c,
      await container.administracion.consultarMetricasGanancias.execute({
        usuarioId: obtenerIdentidad(c).usuarioId,
        ...parsed.data,
      }),
    );
  });
}

export function consultarTendenciasVentasController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = tendenciasVentasQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    return presentResult(
      c,
      await container.administracion.consultarTendenciasVentas.execute({
        usuarioId: obtenerIdentidad(c).usuarioId,
        ...parsed.data,
      }),
    );
  });
}

export function consultarRendimientoSucursalesController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = rendimientoSucursalesQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    return presentResult(
      c,
      await container.administracion.consultarRendimientoSucursales.execute({
        usuarioId: obtenerIdentidad(c).usuarioId,
        ...parsed.data,
      }),
    );
  });
}

export function consultarRankingProductosController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = rankingProductosQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    return presentResult(
      c,
      await container.administracion.consultarRankingProductos.execute({
        usuarioId: obtenerIdentidad(c).usuarioId,
        ...parsed.data,
      }),
    );
  });
}

export function consultarComparativoInventarioController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = comparativoInventarioQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    return presentResult(
      c,
      await container.administracion.consultarComparativoInventario.execute({
        usuarioId: obtenerIdentidad(c).usuarioId,
        ...parsed.data,
      }),
    );
  });
}

/**
 * RF-ADM-A1 / RF-SA-I3: resumen global (sucursales operativas, usuarios activos, ventas consolidadas).
 */
export function consultarResumenDashboardController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = resumenDashboardQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    return presentResult(c, await container.administracion.consultarResumenDashboard.execute(parsed.data));
  });
}
