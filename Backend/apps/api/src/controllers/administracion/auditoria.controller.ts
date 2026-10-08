import { consultarAuditoriaSchema } from '@warengine/contracts';
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