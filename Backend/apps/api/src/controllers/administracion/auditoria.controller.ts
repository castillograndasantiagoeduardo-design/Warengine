import {
  consultarAuditoriaSchema,
  exportarAuditoriaCsvSchema,
} from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { safeHandler } from '../../utils/handler.ts';

export function consultarAuditoriaController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = consultarAuditoriaSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    return presentResult(c, await container.administracion.consultarAuditoria.execute(parsed.data));
  });
}

/**
 * RF-ADM-C20: Exportación de logs de auditoría a CSV / JSON.
 */
export function exportarAuditoriaCsvController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = exportarAuditoriaCsvSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }

    const result = await container.administracion.exportarAuditoriaCsv.execute(parsed.data);
    if (result.isFailure) {
      return presentResult(c, result);
    }

    if (parsed.data.formato === 'json') {
      return c.json(result.value, 200);
    }

    // c.text() forzaría text/plain: se usa c.body() para respetar el tipo CSV
    return c.body(result.value.csv, 200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${result.value.nombreArchivo}"`,
    });
  });
}