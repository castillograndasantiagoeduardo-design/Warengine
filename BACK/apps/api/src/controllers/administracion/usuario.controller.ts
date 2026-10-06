import {
  cambiarEstadoSchema,
  cambiarRolSchema,
  crearUsuarioSchema,
  filtrosUsuariosSchema,
} from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';

export function listarUsuariosController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = filtrosUsuariosSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    return presentResult(c, await container.administracion.listarUsuarios.execute(parsed.data));
  });
}

export function crearUsuarioController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = crearUsuarioSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const { password, ...resto } = parsed.data;
    const result = await container.administracion.crearUsuario.execute({
      ...resto,
      passwordPlain: password,
    });
    return presentResult(c, result, 201);
  });
}

export function cambiarRolUsuarioController(container: AppContainer) {
  return safeHandler(async (c) => {
    const usuarioId = c.req.param('id');
    if (!usuarioId) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de usuario inválido.' }, 400);
    }
    const parsed = cambiarRolSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.administracion.cambiarRolUsuario.execute({
      usuarioId,
      rolId: parsed.data.rolId,
    });
    return presentResult(c, result);
  });
}

export function cambiarEstadoUsuarioController(container: AppContainer) {
  return safeHandler(async (c) => {
    const usuarioId = c.req.param('id');
    if (!usuarioId) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de usuario inválido.' }, 400);
    }
    const parsed = cambiarEstadoSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.administracion.cambiarEstadoUsuario.execute({
      usuarioId,
      isActive: parsed.data.isActive,
    });
    return presentResult(c, result);
  });
}