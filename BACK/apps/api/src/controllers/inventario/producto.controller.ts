import {
  cambiarEstadoProductoSchema,
  crearProductoSchema,
  editarProductoSchema,
  filtrosProductosSchema,
} from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function esUuidValido(id: string | undefined): id is string {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

export function listarProductosController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = filtrosProductosSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    return presentResult(c, await container.inventario.listarProductos.execute(parsed.data));
  });
}

export function obtenerProductoPorIdController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!esUuidValido(id)) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de producto inválido: debe ser un UUID.' }, 400);
    }
    // Aquí TypeScript ya sabe que id es string (type predicate id is string)
    return presentResult(c, await container.inventario.obtenerProductoPorId.execute({ id }));
  });
}

export function crearProductoController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = crearProductoSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.inventario.crearProducto.execute({
      ...parsed.data,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 201);
  });
}

export function editarProductoController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!esUuidValido(id)) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de producto inválido: debe ser un UUID.' }, 400);
    }
    const parsed = editarProductoSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.inventario.editarProducto.execute({
      id,
      ...parsed.data,
      actor: obtenerActor(c),
    });
    return presentResult(c, result);
  });
}

export function cambiarEstadoProductoController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!esUuidValido(id)) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de producto inválido: debe ser un UUID.' }, 400);
    }
    const parsed = cambiarEstadoProductoSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.inventario.cambiarEstadoProducto.execute({
      id,
      isActive: parsed.data.isActive,
      actor: obtenerActor(c),
    });
    return presentResult(c, result);
  });
}
