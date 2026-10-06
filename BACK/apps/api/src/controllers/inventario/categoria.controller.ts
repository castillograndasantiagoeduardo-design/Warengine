import {
  cambiarEstadoCategoriaSchema,
  crearCategoriaSchema,
  editarCategoriaSchema,
  filtrosCategoriasSchema,
} from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerIdentidad } from '../../utils/identidad.ts';

export function listarCategoriasController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = filtrosCategoriasSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    return presentResult(c, await container.inventario.listarCategorias.execute(parsed.data));
  });
}

export function obtenerCategoriaPorIdController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de categoría inválido.' }, 400);
    }
    return presentResult(c, await container.inventario.obtenerCategoriaPorId.execute({ id }));
  });
}

export function crearCategoriaController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = crearCategoriaSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const identidad = obtenerIdentidad(c);
    const result = await container.inventario.crearCategoria.execute({
      nombre: parsed.data.nombre,
      usuarioId: identidad.usuarioId,
    });
    return presentResult(c, result, 201);
  });
}

export function editarCategoriaController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de categoría inválido.' }, 400);
    }
    const parsed = editarCategoriaSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const identidad = obtenerIdentidad(c);
    const result = await container.inventario.editarCategoria.execute({
      id,
      ...parsed.data,
      usuarioId: identidad.usuarioId,
    });
    return presentResult(c, result);
  });
}

export function cambiarEstadoCategoriaController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de categoría inválido.' }, 400);
    }
    const parsed = cambiarEstadoCategoriaSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const identidad = obtenerIdentidad(c);
    const result = await container.inventario.cambiarEstadoCategoria.execute({
      id,
      isActive: parsed.data.isActive,
      usuarioId: identidad.usuarioId,
    });
    return presentResult(c, result);
  });
}
