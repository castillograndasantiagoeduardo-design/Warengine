import {
  asignarActivoEmpleadoSchema,
  asignarActivoAreaSchema,
  devolverActivoSchema,
} from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';
import { obtenerIdentidad } from '../../utils/identidad.ts';

function esUuid(val: string | undefined): val is string {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

export function asignarActivoEmpleadoController(container: AppContainer) {
  return safeHandler(async (c) => {
    const activoId = c.req.param('id');
    if (!esUuid(activoId)) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de activo invalido.' }, 400);
    }
    const parsed = asignarActivoEmpleadoSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.logistica.asignarActivoEmpleado.execute({
      activoId,
      ...parsed.data,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 201);
  });
}

export function asignarActivoAreaController(container: AppContainer) {
  return safeHandler(async (c) => {
    const activoId = c.req.param('id');
    if (!esUuid(activoId)) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de activo invalido.' }, 400);
    }
    const parsed = asignarActivoAreaSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.logistica.asignarActivoArea.execute({
      activoId,
      ...parsed.data,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 201);
  });
}

export function devolverActivoController(container: AppContainer) {
  return safeHandler(async (c) => {
    const activoId = c.req.param('id');
    if (!esUuid(activoId)) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de activo invalido.' }, 400);
    }
    const parsed = devolverActivoSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.logistica.devolverActivo.execute({
      activoId,
      observaciones: parsed.data.observaciones,
      actor: obtenerActor(c),
    });
    return presentResult(c, result);
  });
}

export function consultarHistorialAsignacionesController(container: AppContainer) {
  return safeHandler(async (c) => {
    const activoId = c.req.param('id');
    if (!esUuid(activoId)) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de activo invalido.' }, 400);
    }
    const identidad = obtenerIdentidad(c);
    const result = await container.logistica.consultarHistorialAsignaciones.execute({
      activoId,
      usuarioId: identidad.usuarioId,
    });
    return presentResult(c, result);
  });
}
