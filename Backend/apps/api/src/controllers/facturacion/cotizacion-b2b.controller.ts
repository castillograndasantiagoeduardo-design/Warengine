import {
  actualizarEstadoPedidoB2BSchema,
  crearCotizacionB2BSchema,
  facturarCotizacionB2BSchema,
  filtrosCotizacionesB2BSchema,
  rechazarCotizacionB2BSchema,
} from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';

export function crearCotizacionB2BController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = crearCotizacionB2BSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const actor = obtenerActor(c);
    const result = await container.facturacion.crearCotizacionB2B.execute({
      ...parsed.data,
      actor,
    });
    return presentResult(c, result, 201);
  });
}

export function listarCotizacionesB2BController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = filtrosCotizacionesB2BSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const actor = obtenerActor(c);
    const result = await container.facturacion.listarCotizacionesB2B.execute({
      ...parsed.data,
      actor,
    });
    return presentResult(c, result);
  });
}

export function obtenerCotizacionB2BController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!id || id.trim() === '') {
      return c.json({ error: 'VALIDATION_ERROR', message: 'ID de cotización requerido.' }, 400);
    }
    const actor = obtenerActor(c);
    const result = await container.facturacion.obtenerCotizacionB2B.execute({
      cotizacionId: id,
      actor,
    });
    return presentResult(c, result);
  });
}

export function avalarCotizacionB2BController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!id || id.trim() === '') {
      return c.json({ error: 'VALIDATION_ERROR', message: 'ID de cotización requerido.' }, 400);
    }
    const actor = obtenerActor(c);
    const result = await container.facturacion.avalarCotizacionB2B.execute({
      cotizacionId: id,
      accion: 'avalar',
      actor,
    });
    return presentResult(c, result);
  });
}

export function rechazarCotizacionB2BController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!id || id.trim() === '') {
      return c.json({ error: 'VALIDATION_ERROR', message: 'ID de cotización requerido.' }, 400);
    }
    const parsed = rechazarCotizacionB2BSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const actor = obtenerActor(c);
    const result = await container.facturacion.avalarCotizacionB2B.execute({
      cotizacionId: id,
      accion: 'rechazar',
      motivoRechazo: parsed.data.motivoRechazo,
      actor,
    });
    return presentResult(c, result);
  });
}

export function facturarCotizacionB2BController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!id || id.trim() === '') {
      return c.json({ error: 'VALIDATION_ERROR', message: 'ID de cotización requerido.' }, 400);
    }
    const rawBody = await leerJson(c);
    const parsed = facturarCotizacionB2BSchema.safeParse(rawBody ?? {});
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const actor = obtenerActor(c);
    const result = await container.facturacion.facturarCotizacionB2B.execute({
      cotizacionId: id,
      ...parsed.data,
      actor,
    });
    return presentResult(c, result, 201);
  });
}

export function actualizarEstadoPedidoB2BController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!id || id.trim() === '') {
      return c.json({ error: 'VALIDATION_ERROR', message: 'ID de cotización requerido.' }, 400);
    }
    const parsed = actualizarEstadoPedidoB2BSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const actor = obtenerActor(c);
    const result = await container.facturacion.actualizarEstadoPedidoB2B.execute({
      cotizacionId: id,
      estadoPedido: parsed.data.estadoPedido,
      actor,
    });
    return presentResult(c, result);
  });
}
