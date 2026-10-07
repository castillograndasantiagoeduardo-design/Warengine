import {
  cambiarEstadoProveedorSchema,
  crearProveedorSchema,
  editarProveedorSchema,
  filtrosProveedoresSchema,
} from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerIdentidad } from '../../utils/identidad.ts';

export function listarProveedoresController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = filtrosProveedoresSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    return presentResult(c, await container.inventario.listarProveedores.execute(parsed.data));
  });
}

export function obtenerProveedorPorIdController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de proveedor inválido.' }, 400);
    }
    return presentResult(c, await container.inventario.obtenerProveedorPorId.execute({ id }));
  });
}

export function crearProveedorController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = crearProveedorSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const identidad = obtenerIdentidad(c);
    const result = await container.inventario.crearProveedor.execute({
      nombre: parsed.data.nombre,
      contacto: parsed.data.contacto ?? null,
      usuarioId: identidad.usuarioId,
    });
    return presentResult(c, result, 201);
  });
}

export function editarProveedorController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de proveedor inválido.' }, 400);
    }
    const parsed = editarProveedorSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const identidad = obtenerIdentidad(c);
    const result = await container.inventario.editarProveedor.execute({
      id,
      ...parsed.data,
      usuarioId: identidad.usuarioId,
    });
    return presentResult(c, result);
  });
}

export function cambiarEstadoProveedorController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de proveedor inválido.' }, 400);
    }
    const parsed = cambiarEstadoProveedorSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const identidad = obtenerIdentidad(c);
    const result = await container.inventario.cambiarEstadoProveedor.execute({
      id,
      isActive: parsed.data.isActive,
      usuarioId: identidad.usuarioId,
    });
    return presentResult(c, result);
  });
}
