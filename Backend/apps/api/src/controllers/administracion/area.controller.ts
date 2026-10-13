/**
 * area.controller.ts
 *
 * Controladores HTTP para la gestión de áreas operativas por sucursal.
 *
 * Rol en la arquitectura:
 * - Capa de Presentación / Controladores HTTP (Hono).
 * - Extrae parámetros de ruta y cuerpos de petición, los valida contra los esquemas Zod
 *   de `@warengine/contracts`, inyecta el actor de auditoría extraído del token JWT
 *   y formatea la respuesta con `presentResult`.
 *
 * Requisito SRS:
 * - RF-ADM-C4: Endpoints para consultar, crear, editar y eliminar áreas por sucursal.
 */

import { crearAreaSchema, editarAreaSchema } from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';

export function listarAreasPorSucursalController(container: AppContainer) {
  return safeHandler(async (c) => {
    const sucursalId = Number(c.req.param('id'));
    if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'ID de sucursal inválido.' }, 400);
    }
    return presentResult(
      c,
      await container.administracion.listarAreasPorSucursal.execute({ sucursalId }),
    );
  });
}

export function crearAreaController(container: AppContainer) {
  return safeHandler(async (c) => {
    const sucursalId = Number(c.req.param('id'));
    if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'ID de sucursal inválido.' }, 400);
    }
    const parsed = crearAreaSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.administracion.crearArea.execute({
      sucursalId,
      ...parsed.data,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 201);
  });
}

export function editarAreaController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'ID de área inválido.' }, 400);
    }
    const parsed = editarAreaSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    return presentResult(
      c,
      await container.administracion.editarArea.execute({
        id,
        ...parsed.data,
        actor: obtenerActor(c),
      }),
    );
  });
}

export function eliminarAreaController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'ID de área inválido.' }, 400);
    }
    return presentResult(
      c,
      await container.administracion.eliminarArea.execute({
        id,
        actor: obtenerActor(c),
      }),
    );
  });
}
