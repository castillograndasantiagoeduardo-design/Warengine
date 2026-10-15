import {
  filtrosKardexSchema,
  registrarEntradaSchema,
  registrarSalidaSchema,
} from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';

export function registrarEntradaController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = registrarEntradaSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.inventario.registrarEntrada.execute({
      ...parsed.data,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 201);
  });
}

export function registrarSalidaController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = registrarSalidaSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.inventario.registrarSalida.execute({
      ...parsed.data,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 201);
  });
}

/**
 * RF-ADM-B10: Consulta paginada y filtrable del historial de movimientos (Kardex).
 */
export function consultarKardexController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = filtrosKardexSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.inventario.consultarKardex.execute({
      ...parsed.data,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 200);
  });
}
