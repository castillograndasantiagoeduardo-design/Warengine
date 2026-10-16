import {
  ajustarInventarioSchema,
  anularEntradaSchema,
  filtrosEntradasSchema,
  filtrosKardexSchema,
  filtrosExportarKardexSchema,
  registrarEntradaSchema,
  registrarSalidaSchema,
  transferirMercanciaSchema,
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

/**
 * RF-ADM-B16: Anulación transaccional y compensatoria de una entrada de mercancía.
 */
export function anularEntradaController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!esUuidValido(id)) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de entrada inválido: debe ser un UUID.' }, 400);
    }
    const parsed = anularEntradaSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.inventario.anularEntrada.execute({
      id,
      motivo: parsed.data.motivo,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 200);
  });
}

/**
 * RF-ADM-B17: Ajuste de inventario con conteo físico (cuadre de existencias).
 */
export function ajustarInventarioController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = ajustarInventarioSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.inventario.ajustarInventario.execute({
      productoId: parsed.data.productoId,
      sucursalId: parsed.data.sucursalId,
      stockFisico: parsed.data.stockFisico,
      motivo: parsed.data.motivo,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 200);
  });
}

/**
 * RF-ADM-B18: Transferencia de mercancía entre sucursales.
 */
export function transferirMercanciaController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = transferirMercanciaSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.inventario.transferirMercancia.execute({
      ...parsed.data,
      actor: obtenerActor(c),
    });
    return presentResult(c, result, 200);
  });
}

/**
 * RF-ADM-B21: Exportación de movimientos kardex a CSV.
 */
export function exportarKardexCsvController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = filtrosExportarKardexSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }

    const result = await container.inventario.exportarKardexCsv.execute({
      ...parsed.data,
      actor: obtenerActor(c),
    });

    if (result.isFailure) {
      return presentResult(c, result);
    }

    if (parsed.data.formato === 'json') {
      return c.json(result.value, 200);
    }

    c.header('Content-Type', 'text/csv; charset=utf-8');
    c.header('Content-Disposition', `attachment; filename="${result.value.nombreArchivo}"`);
    return c.text(result.value.csv, 200);
  });
}




