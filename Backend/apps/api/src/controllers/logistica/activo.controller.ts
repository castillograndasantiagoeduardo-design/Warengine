import {
  crearActivoSchema,
  filtrosActivosSchema,
  darBajaActivoSchema,
} from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';
import { obtenerIdentidad } from '../../utils/identidad.ts';

function esUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

export function crearActivoController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = crearActivoSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.logistica.crearActivo.execute({
      ...parsed.data,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 201);
  });
}

export function listarActivosController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = filtrosActivosSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const identidad = obtenerIdentidad(c);
    const result = await container.logistica.listarActivos.execute({
      usuarioId: identidad.usuarioId,
      ...parsed.data,
    });
    return presentResult(c, result);
  });
}

export function consultarActivoController(container: AppContainer) {
  return safeHandler(async (c) => {
    const activoId = c.req.param('id');
    if (!esUuid(activoId)) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de activo invalido.' }, 400);
    }
    const identidad = obtenerIdentidad(c);
    const result = await container.logistica.consultarActivo.execute({
      activoId,
      usuarioId: identidad.usuarioId,
    });
    return presentResult(c, result);
  });
}

export function darBajaActivoController(container: AppContainer) {
  return safeHandler(async (c) => {
    const activoId = c.req.param('id');
    if (!esUuid(activoId)) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de activo invalido.' }, 400);
    }
    const parsed = darBajaActivoSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.logistica.darBajaActivo.execute({
      activoId,
      motivo: parsed.data.motivo,
      actor: obtenerActor(c),
    });
    return presentResult(c, result);
  });
}
