import {
  filtrosEntradasSchema,
  filtrosKardexSchema,
  registrarEntradaSchema,
  registrarSalidaSchema,
} from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function esUuidValido(id: string | undefined): id is string {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

export function registrarEntradaController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = registrarEntradaSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.inventario.registrarEntrada.execute({
      ...parsed.data,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 201);
  });
}

export function registrarSalidaController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = registrarSalidaSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.inventario.registrarSalida.execute({
      ...parsed.data,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 201);
  });
}

/**
 * RF-ADM-B10: Consulta paginada y filtrable del historial de movimientos (Kardex).
 */
export function consultarKardexController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = filtrosKardexSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.inventario.consultarKardex.execute({
      ...parsed.data,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 200);
  });
}

/**
 * RF-ADM-B15: Listado paginado de entradas de mercancía con filtros por fecha, proveedor y sucursal.
 */
export function listarEntradasController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = filtrosEntradasSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.inventario.listarEntradas.execute({
      ...parsed.data,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 200);
  });
}

/**
 * RF-ADM-B15: Detalle completo de una entrada de mercancía por ID.
 */
export function obtenerEntradaPorIdController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!esUuidValido(id)) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de entrada inválido: debe ser un UUID.' }, 400);
    }
    const result = await container.inventario.obtenerEntradaPorId.execute({
      id,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 200);
  });
}

