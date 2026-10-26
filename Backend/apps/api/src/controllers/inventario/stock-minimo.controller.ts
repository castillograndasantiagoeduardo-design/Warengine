import {
  configurarStockMinimoSchema,
  consultarStockSucursalParamsSchema,
  stockSucursalQuerySchema,
} from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';

/**
 * RF-ADM-B11: Controlador para configurar el umbral de stock mínimo por producto y sucursal.
 */
export function configurarStockMinimoController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = configurarStockMinimoSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.inventario.configurarStockMinimo.execute({
      ...parsed.data,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 200);
  });
}

/**
 * RF-ADM-B11: Controlador para consultar el estado del stock y umbral mínimo de un producto en sucursal.
 */
export function consultarStockSucursalController(container: AppContainer) {
  return safeHandler(async (c) => {
    const rawParams = {
      sucursalId: c.req.param('sucursalId'),
      productoId: c.req.param('productoId'),
    };
    const parsed = consultarStockSucursalParamsSchema.safeParse(rawParams);
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.inventario.consultarStockSucursal.execute({
      ...parsed.data,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 200);
  });
}

/**
 * Existencias reales de una sede completa (POS y vendedor B2B), acotadas por alcance.
 */
export function listarStockSucursalController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = stockSucursalQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.inventario.listarStockSucursal.execute({
      sucursalId: parsed.data.sucursalId,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 200);
  });
}
