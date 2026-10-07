import {
  cambiarEstadoSchema,
  cambiarRolSchema,
  crearUsuarioSchema,
  filtrosUsuariosSchema,
  restablecerPasswordSchema,
} from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';

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
      actor: obtenerActor(c),
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
      actor: obtenerActor(c),
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
      actor: obtenerActor(c),
    });
    return presentResult(c, result);
  });
}

export function restablecerPasswordUsuarioController(container: AppContainer) {
  return safeHandler(async (c) => {
    const usuarioId = c.req.param('id');
    if (!usuarioId) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de usuario inválido.' }, 400);
    }
    const parsed = restablecerPasswordSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.administracion.restablecerPasswordUsuario.execute({
      usuarioId,
      nuevaPassword: parsed.data.nuevaPassword,
      actor: obtenerActor(c),
    });
    return presentResult(c, result);
  });
}