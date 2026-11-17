import {
    actualizarClienteSchema,
    crearClienteSchema,
    decidirCreditoClienteSchema,
    filtrosClientesSchema,
    simularCreditoB2BSchema,
} from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';

export function buscarClientesController(container: AppContainer) {
    return safeHandler(async (c) => {
        const parsed = filtrosClientesSchema.safeParse(c.req.query());
        if (!parsed.success) {
            return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
        }
        return presentResult(c, await container.facturacion.buscarClientes.execute(parsed.data));
    });
}

export function obtenerClientePorIdController(container: AppContainer) {
    return safeHandler(async (c) => {
        const id = c.req.param('id');
        if (!id || id.trim() === '') {
            return c.json({ error: 'VALIDATION_ERROR', message: 'ID de cliente requerido.' }, 400);
        }
        return presentResult(c, await container.facturacion.obtenerClientePorId.execute({ id }));
    });
}

export function registrarClienteController(container: AppContainer) {
    return safeHandler(async (c) => {
        const parsed = crearClienteSchema.safeParse(await leerJson(c));
        if (!parsed.success) {
            return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
        }
        const actor = obtenerActor(c);
        const result = await container.facturacion.registrarCliente.execute({
            ...parsed.data,
            actor,
        });
        if (result.isFailure) return presentResult(c, result);

        // 201 si se creó, 200 si se reutilizó uno existente.
        const { cliente, yaExistia, evaluacionCredito, alertaSuperAdminEnviada } = result.value;
        return c.json(
            {
                cliente,
                yaExistia,
                ...(evaluacionCredito !== undefined ? { evaluacionCredito } : {}),
                ...(alertaSuperAdminEnviada !== undefined ? { alertaSuperAdminEnviada } : {}),
            },
            yaExistia ? 200 : 201,
        );
    });
}

export function actualizarClienteController(container: AppContainer) {
    return safeHandler(async (c) => {
        const id = c.req.param('id');
        if (!id || id.trim() === '') {
            return c.json({ error: 'VALIDATION_ERROR', message: 'ID de cliente requerido.' }, 400);
        }
        const parsed = actualizarClienteSchema.safeParse(await leerJson(c));
        if (!parsed.success) {
            return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
        }
        const actor = obtenerActor(c);
        const result = await container.facturacion.actualizarCliente.execute({
            id,
            ...parsed.data,
            actor,
        });
        return presentResult(c, result);
    });
}

export function simularCreditoB2BController(container: AppContainer) {
    return safeHandler(async (c) => {
        const parsed = simularCreditoB2BSchema.safeParse(await leerJson(c));
        if (!parsed.success) {
            return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
        }
        return presentResult(c, container.facturacion.simularCreditoB2B.execute(parsed.data));
    });
}

export function listarCreditosPendientesController(container: AppContainer) {
    return safeHandler(async (c) => {
        return presentResult(c, await container.facturacion.listarCreditosPendientes.execute());
    });
}

export function decidirCreditoClienteB2BController(container: AppContainer) {
    return safeHandler(async (c) => {
        const id = c.req.param('id');
        if (!id || id.trim() === '') {
            return c.json({ error: 'VALIDATION_ERROR', message: 'ID de cliente requerido.' }, 400);
        }
        const parsed = decidirCreditoClienteSchema.safeParse(await leerJson(c));
        if (!parsed.success) {
            return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
        }
        const actor = obtenerActor(c);
        const result = await container.facturacion.decidirCreditoClienteB2B.execute({
            clienteId: id,
            ...parsed.data,
            actor,
        });
        return presentResult(c, result);
    });
}