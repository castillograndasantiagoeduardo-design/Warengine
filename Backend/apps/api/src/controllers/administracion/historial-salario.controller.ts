/**
 * historial-salario.controller.ts
 *
 * Controladores HTTP para la consulta y registro de aumentos / historial salarial de empleados.
 *
 * Rol en la arquitectura:
 * - Capa de Presentación / Controladores HTTP (Hono).
 * - Adapta parámetros de ruta y payloads validados con Zod hacia los casos de uso correspondientes.
 *
 * Requisito SRS:
 * - RF-ADM-C14: Historial de salarios de empleados.
 */

import { registrarAumentoSalarioSchema } from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';

export function consultarHistorialSalariosController(container: AppContainer) {
  return safeHandler(async (c) => {
    const empleadoId = c.req.param('id');
    if (!empleadoId || empleadoId.trim() === '') {
      return c.json({ error: 'VALIDATION_ERROR', message: 'ID de empleado requerido.' }, 400);
    }
    return presentResult(
      c,
      await container.administracion.consultarHistorialSalarios.execute({ empleadoId }),
    );
  });
}

export function registrarAumentoSalarioController(container: AppContainer) {
  return safeHandler(async (c) => {
    const empleadoId = c.req.param('id');
    if (!empleadoId || empleadoId.trim() === '') {
      return c.json({ error: 'VALIDATION_ERROR', message: 'ID de empleado requerido.' }, 400);
    }
    const parsed = registrarAumentoSalarioSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.administracion.registrarAumentoSalario.execute({
      empleadoId,
      ...parsed.data,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 201);
  });
}
