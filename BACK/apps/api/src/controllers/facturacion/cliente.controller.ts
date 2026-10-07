import { crearClienteSchema, filtrosClientesSchema } from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';

export function buscarClientesController(container: AppContainer) {
    return safeHandler(async (c) => {
        const parsed = filtrosClientesSchema.safeParse(c.req.query());
        if (!parsed.success) {
            return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
        }
        return presentResult(c, await container.facturacion.buscarClientes.execute(parsed.data));
    });
}

export function registrarClienteController(container: AppContainer) {
    return safeHandler(async (c) => {
        const parsed = crearClienteSchema.safeParse(await leerJson(c));
        if (!parsed.success) {
            return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
        }
        const result = await container.facturacion.registrarCliente.execute(parsed.data);
        if (result.isFailure) return presentResult(c, result);

        // 201 si se creó, 200 si se reutilizó uno existente.
        const { cliente, yaExistia } = result.value;
        return c.json({ cliente, yaExistia }, yaExistia ? 200 : 201);
    });
}