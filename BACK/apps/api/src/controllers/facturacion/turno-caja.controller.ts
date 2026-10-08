import { abrirTurnoCajaSchema } from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';
import { obtenerIdentidad } from '../../utils/identidad.ts';

export function abrirTurnoCajaController(container: AppContainer) {
    return safeHandler(async (c) => {
        const parsed = abrirTurnoCajaSchema.safeParse(await leerJson(c));
        if (!parsed.success) {
            return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
        }
        const result = await container.facturacion.abrirTurnoCaja.execute({
            fondoInicial: parsed.data.fondoInicial,
            actor: obtenerActor(c),
        });
        return presentResult(c, result, 201);
    });
}

export function obtenerTurnoActualController(container: AppContainer) {
    return safeHandler(async (c) => {
        const result = await container.facturacion.obtenerTurnoActual.execute({
            usuarioId: obtenerIdentidad(c).usuarioId,
        });
        return presentResult(c, result);
    });
}