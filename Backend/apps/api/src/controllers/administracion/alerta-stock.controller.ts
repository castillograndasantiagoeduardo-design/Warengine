import { filtrosAlertasStockSchema } from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { safeHandler } from '../../utils/handler.ts';
import { obtenerIdentidad } from '../../utils/identidad.ts';

export function consultarAlertasStockController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = filtrosAlertasStockSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    return presentResult(
      c,
      await container.administracion.consultarAlertasStock.execute({
        usuarioId: obtenerIdentidad(c).usuarioId,
        ...parsed.data,
      }),
    );
  });
}