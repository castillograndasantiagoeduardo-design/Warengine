import { AppContainer } from '@warengine/composition';
import { PRIORIDADES_ALERTA } from '@warengine/contracts';
import { z } from 'zod';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';

const alertarAdminFacturacionSchema = z.object({
    motivo: z
        .string({ required_error: 'El motivo es obligatorio.' })
        .trim()
        .min(2, { message: 'El motivo debe tener al menos 2 caracteres.' })
        .max(100, { message: 'El motivo no puede exceder 100 caracteres.' }),
    prioridad: z.enum(PRIORIDADES_ALERTA).default('normal'),
    descripcion: z
        .string()
        .trim()
        .max(500, { message: 'La descripción no puede exceder 500 caracteres.' })
        .optional()
        .nullable(),
});

export function emitirAlertaFacturacionController(container: AppContainer) {
    return safeHandler(async (c) => {
        const parsed = alertarAdminFacturacionSchema.safeParse(await leerJson(c));
        if (!parsed.success) {
            return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
        }
        const actor = obtenerActor(c);
        const result = await container.facturacion.emitirAlertaFacturacion.execute({
            motivo: parsed.data.motivo,
            prioridad: parsed.data.prioridad,
            descripcion: parsed.data.descripcion,
            actor,
        });
        return presentResult(c, result, 201);
    });
}
