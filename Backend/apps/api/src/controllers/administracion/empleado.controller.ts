/**
 * empleado.controller.ts
 *
 * Controladores HTTP para la consulta y actualización laboral de empleados.
 *
 * Rol en la arquitectura:
 * - Capa de Presentación / Controladores HTTP (Hono).
 * - Adapta las solicitudes HTTP a los casos de uso del dominio de administración de personal,
 *   procesando parámetros de consulta y cuerpos JSON validados con Zod.
 *
 * Requisito SRS:
 * - RF-ADM-C5: Listado de colaboradores con filtros.
 * - RF-ADM-C12: Actualización de datos laborales y de contacto de empleados.
 */

import { editarEmpleadoSchema, listarEmpleadosQuerySchema } from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';

export function listarEmpleadosController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = listarEmpleadosQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    return presentResult(
      c,
      await container.administracion.listarEmpleados.execute(parsed.data),
    );
  });
}

export function obtenerEmpleadoPorIdController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!id || id.trim() === '') {
      return c.json({ error: 'VALIDATION_ERROR', message: 'ID de empleado requerido.' }, 400);
    }
    return presentResult(
      c,
      await container.administracion.obtenerEmpleadoPorId.execute({ id }),
    );
  });
}

export function editarEmpleadoController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!id || id.trim() === '') {
      return c.json({ error: 'VALIDATION_ERROR', message: 'ID de empleado requerido.' }, 400);
    }
    const parsed = editarEmpleadoSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    return presentResult(
      c,
      await container.administracion.editarEmpleado.execute({
        id,
        ...parsed.data,
        actor: obtenerActor(c),
      }),
    );
  });
}
