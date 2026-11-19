import {
    actualizarClienteSchema,
    ClienteDto,
    crearClienteSchema,
    decidirCreditoClienteSchema,
    filtrosClientesSchema,
    simularCreditoB2BSchema,
} from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { Cliente } from '@warengine/core';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';

function toClienteDto(cliente: Cliente): ClienteDto {
    return {
        id: cliente.id,
        tipoDocumento: cliente.tipoDocumento,
        numeroDocumento: cliente.numeroDocumento,
        nombreRazonSocial: cliente.nombreRazonSocial,
        tipoCliente: cliente.tipoCliente,
        email: cliente.email,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        creditoHabilitado: cliente.creditoHabilitado,
        saldoPendiente: cliente.saldoPendiente ?? 0,
        totalCompras: cliente.totalCompras ?? 0,
        gananciaNetaMensual: cliente.gananciaNetaMensual,
        antiguedadEmpresaMeses: cliente.antiguedadEmpresaMeses,
        plazoCreditoDias: cliente.plazoCreditoDias,
        cupoCreditoSugerido: cliente.cupoCreditoSugerido,
        cupoCreditoAprobado: cliente.cupoCreditoAprobado,
        cupoCreditoUtilizado: cliente.cupoCreditoUtilizado,
        cupoCreditoDisponible: cliente.cupoCreditoDisponible,
        nivelRiesgoCredito: cliente.nivelRiesgoCredito,
        estadoCredito: cliente.estadoCredito,
        creditoAprobadoPor: cliente.creditoAprobadoPor,
        creditoAprobadoEn: cliente.creditoAprobadoEn ? cliente.creditoAprobadoEn.toISOString() : null,
        motivoDecisionCredito: cliente.motivoDecisionCredito,
        observacionFinanciera: cliente.observacionFinanciera,
    };
}

export function buscarClientesController(container: AppContainer) {
    return safeHandler(async (c) => {
        const parsed = filtrosClientesSchema.safeParse(c.req.query());
        if (!parsed.success) {
            return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
        }
        const result = await container.facturacion.buscarClientes.execute(parsed.data);
        if (result.isFailure) {
            return presentResult(c, result);
        }

        const val = result.value;
        if (!Array.isArray(val)) {
            const itemsDto = val.items.map(toClienteDto);
            return c.json({
                items: itemsDto,
                clientes: itemsDto, // retrocompatibilidad pos.service.ts
                total: val.total,
                totalPaginas: val.totalPaginas,
                page: val.page,
                limite: val.limite,
                resumen: val.resumen,
            });
        }

        return c.json(val.map(toClienteDto));
    });
}

export function obtenerClientePorIdController(container: AppContainer) {
    return safeHandler(async (c) => {
        const id = c.req.param('id');
        if (!id || id.trim() === '') {
            return c.json({ error: 'VALIDATION_ERROR', message: 'ID de cliente requerido.' }, 400);
        }
        const result = await container.facturacion.obtenerClientePorId.execute({ id });
        if (result.isFailure) return presentResult(c, result);
        return c.json(toClienteDto(result.value));
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
                cliente: toClienteDto(cliente),
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
        if (result.isFailure) return presentResult(c, result);
        return c.json(toClienteDto(result.value));
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
