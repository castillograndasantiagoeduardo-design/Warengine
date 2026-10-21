import {
  crearCategoriaActivoSchema,
  editarCategoriaActivoSchema,
  cambiarEstadoCategoriaActivoSchema,
  filtrosCategoriasActivosSchema,
} from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';

export function listarCategoriasActivosController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = filtrosCategoriasActivosSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const resultado = await container.logistica.listarCategoriasActivos.execute(parsed.data);
    return c.json(resultado);
  });
}

export function crearCategoriaActivoController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = crearCategoriaActivoSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.logistica.crearCategoriaActivo.execute({
      nombre: parsed.data.nombre,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 201);
  });
}

export function editarCategoriaActivoController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de categoria invalido.' }, 400);
    }
    const parsed = editarCategoriaActivoSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.logistica.editarCategoriaActivo.execute({
      id,
      nombre: parsed.data.nombre,
      actor: obtenerActor(c),
    });
    return presentResult(c, result);
  });
}

export function cambiarEstadoCategoriaActivoController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de categoria invalido.' }, 400);
    }
    const parsed = cambiarEstadoCategoriaActivoSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.logistica.cambiarEstadoCategoriaActivo.execute({
      id,
      isActive: parsed.data.isActive,
      actor: obtenerActor(c),
    });
    return presentResult(c, result);
  });
}
