import {
  registrarMantenimientoSchema,
  finalizarMantenimientoSchema,
} from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';
import { obtenerIdentidad } from '../../utils/identidad.ts';

function esUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

export function registrarMantenimientoController(container: AppContainer) {
  return safeHandler(async (c) => {
    const activoId = c.req.param('id');
    if (!esUuid(activoId)) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de activo invalido.' }, 400);
    }
    const parsed = registrarMantenimientoSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.logistica.registrarMantenimiento.execute({
      activoId,
      ...parsed.data,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 201);
  });
}

export function finalizarMantenimientoController(container: AppContainer) {
  return safeHandler(async (c) => {
    const mantenimientoId = c.req.param('id');
    if (!esUuid(mantenimientoId)) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de mantenimiento invalido.' }, 400);
    }
    const parsed = finalizarMantenimientoSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.logistica.finalizarMantenimiento.execute({
      mantenimientoId,
      ...parsed.data,
      actor: obtenerActor(c),
    });
    return presentResult(c, result);
  });
}

export function consultarHistorialMantenimientosController(container: AppContainer) {
  return safeHandler(async (c) => {
    const activoId = c.req.param('id');
    if (!esUuid(activoId)) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de activo invalido.' }, 400);
    }
    const identidad = obtenerIdentidad(c);
    const result = await container.logistica.consultarHistorialMantenimientos.execute({
      activoId,
      usuarioId: identidad.usuarioId,
    });
    return presentResult(c, result);
  });
}
