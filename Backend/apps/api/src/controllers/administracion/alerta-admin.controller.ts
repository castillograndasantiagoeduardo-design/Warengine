/**
 * alerta-admin.controller.ts
 *
 * Controladores HTTP para la gestión de alertas administrativas (RF-ADM-C13).
 */

import {
  cambiarEstadoAlertaAdminSchema,
  crearAlertaAdminSchema,
  listarAlertasAdminQuerySchema,
} from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';

export function listarAlertasAdminController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = listarAlertasAdminQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const actor = obtenerActor(c);
    return presentResult(
      c,
      await container.administracion.listarAlertasAdmin.execute({
        usuarioId: actor.usuarioId,
        ...parsed.data,
      }),
    );
  });
}

export function crearAlertaAdminController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = crearAlertaAdminSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const actor = obtenerActor(c);
    return presentResult(
      c,
      await container.administracion.crearAlertaAdmin.execute({
        ...parsed.data,
        actor,
      }),
      201,
    );
  });
}

export function cambiarEstadoAlertaAdminController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!id || id.trim() === '') {
      return c.json({ error: 'VALIDATION_ERROR', message: 'ID de alerta requerido.' }, 400);
    }
    const parsed = cambiarEstadoAlertaAdminSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const actor = obtenerActor(c);
    return presentResult(
      c,
      await container.administracion.atenderAlertaAdmin.execute({
        id,
        estado: parsed.data.estado,
        actor,
      }),
    );
  });
}
