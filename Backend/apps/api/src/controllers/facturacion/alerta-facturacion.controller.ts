import { AppContainer } from '@warengine/composition';
import { emitirAlertaFacturacionSchema } from '@warengine/contracts';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';

export function emitirAlertaFacturacionController(container: AppContainer) {
    return safeHandler(async (c) => {
        const parsed = emitirAlertaFacturacionSchema.safeParse(await leerJson(c));
        if (!parsed.success) {
            return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
        }
        const actor = obtenerActor(c);
        const result = await container.facturacion.emitirAlertaFacturacion.execute({
            sucursalId: parsed.data.sucursalId,
            motivo: parsed.data.motivo,
            prioridad: parsed.data.prioridad,
            descripcion: parsed.data.descripcion,
            actor,
        });
        return presentResult(c, result, 201);
    });
}
