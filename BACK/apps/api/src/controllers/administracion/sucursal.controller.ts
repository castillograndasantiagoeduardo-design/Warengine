import { crearSucursalSchema, editarSucursalSchema } from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';

export function listarSucursalesController(container: AppContainer) {
  return safeHandler(async (c) =>
    presentResult(c, await container.administracion.listarSucursales.execute())
  );
}

export function crearSucursalController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = crearSucursalSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.administracion.crearSucursal.execute(parsed.data);
    return presentResult(c, result, 201);
  });
}

export function editarSucursalController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de sucursal inválido.' }, 400);
    }
    const parsed = editarSucursalSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    return presentResult(c, await container.administracion.editarSucursal.execute({ id, ...parsed.data }));
  });
}
