import {
  cambiarEstadoProductoSchema,
  crearProductoSchema,
  editarProductoSchema,
  filtrosProductosSchema,
  filtrosExportarProductosSchema,
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
    return presentResult(
      c,
      await container.inventario.listarProductos.execute({
        ...parsed.data,
        actor: obtenerActor(c),
      }),
    );
  });
}

export function obtenerProductoPorIdController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!esUuidValido(id)) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de producto inválido: debe ser un UUID.' }, 400);
    }
    // Aquí TypeScript ya sabe que id es string (type predicate id is string)
    return presentResult(
      c,
      await container.inventario.obtenerProductoPorId.execute({
        id,
        actor: obtenerActor(c),
      }),
    );
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

export function consultarHistorialPreciosController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!esUuidValido(id)) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de producto inválido: debe ser un UUID.' }, 400);
    }
    const result = await container.inventario.consultarHistorialPrecios.execute({
      productoId: id,
      actor: obtenerActor(c),
    });
    return presentResult(c, result);
  });
}

/**
 * RF-ADM-B20: Importación masiva de productos desde archivo CSV.
 */
export function importarProductosController(container: AppContainer) {
  return safeHandler(async (c) => {
    let csvContenido = '';
    const contentType = c.req.header('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const body = await c.req.parseBody();
      const archivo = body['archivo'] ?? body['file'] ?? body['csv'];
      if (archivo instanceof File) {
        csvContenido = await archivo.text();
      } else if (typeof archivo === 'string') {
        csvContenido = archivo;
      }
    } else if (contentType.includes('application/json')) {
      const json = (await leerJson(c)) as Record<string, unknown> | null;
      csvContenido = typeof json?.csv === 'string'
        ? json.csv
        : typeof json?.csvContenido === 'string'
          ? json.csvContenido
          : '';
    } else if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
      csvContenido = await c.req.text();
    } else {
      // Intentar leer json o texto como fallback
      try {
        const json = (await leerJson(c)) as Record<string, unknown> | null;
        csvContenido = typeof json?.csv === 'string'
          ? json.csv
          : typeof json?.csvContenido === 'string'
            ? json.csvContenido
            : '';
      } catch {
        csvContenido = await c.req.text();
      }
    }

    if (!csvContenido || !csvContenido.trim()) {
      return c.json(
        {
          error: 'VALIDATION_ERROR',
          message:
            'Se requiere el archivo CSV en el campo "archivo" (multipart/form-data), "csv" (JSON) o como texto plano (text/csv).',
        },
        400,
      );
    }

    const result = await container.inventario.importarProductos.execute({
      csvContenido,
      actor: obtenerActor(c),
    });

    return presentResult(c, result, 200);
  });
}

export function exportarProductosCsvController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = filtrosExportarProductosSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }

    const result = await container.inventario.exportarProductosCsv.execute({
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

