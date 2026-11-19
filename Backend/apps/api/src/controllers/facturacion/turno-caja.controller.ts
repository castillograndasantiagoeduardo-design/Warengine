import {
    abrirTurnoCajaSchema,
    cerrarTurnoCajaSchema,
    cierreAdministrativoTurnoSchema,
    historialTurnosQuerySchema,
    listarTurnosAbiertosQuerySchema,
} from '@warengine/contracts';
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

export function listarTurnosAbiertosController(container: AppContainer) {
    return safeHandler(async (c) => {
        const parsed = listarTurnosAbiertosQuerySchema.safeParse(c.req.query());
        if (!parsed.success) {
            return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
        }
        const result = await container.facturacion.listarTurnosAbiertos.execute({
            usuarioId: obtenerIdentidad(c).usuarioId,
            sucursalId: parsed.data.sucursalId,
        });
        return presentResult(c, result);
    });
}

export function cerrarTurnoCajaController(container: AppContainer) {
    return safeHandler(async (c) => {
        const id = c.req.param('id');
        if (!id || id.trim() === '') {
            return c.json({ error: 'VALIDATION_ERROR', message: 'ID del turno requerido.' }, 400);
        }
        const parsed = cerrarTurnoCajaSchema.safeParse(await leerJson(c));
        if (!parsed.success) {
            return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
        }
        const result = await container.facturacion.cerrarTurnoCaja.execute({
            turnoId: id,
            fondoFinal: parsed.data.fondoFinal,
            actor: obtenerActor(c),
        });
        return presentResult(c, result);
    });
}

export function cerrarTurnoAdministrativoController(container: AppContainer) {
    return safeHandler(async (c) => {
        const id = c.req.param('id');
        if (!id || id.trim() === '') {
            return c.json({ error: 'VALIDATION_ERROR', message: 'ID del turno requerido.' }, 400);
        }
        const parsed = cierreAdministrativoTurnoSchema.safeParse(await leerJson(c));
        if (!parsed.success) {
            return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
        }
        const result = await container.facturacion.cerrarTurnoAdministrativo.execute({
            turnoId: id,
            motivo: parsed.data.motivo,
            fondoFinal: parsed.data.fondoFinal,
            actor: obtenerActor(c),
        });
        return presentResult(c, result);
    });
}

export function listarHistorialTurnosController(container: AppContainer) {
    return safeHandler(async (c) => {
        const parsed = historialTurnosQuerySchema.safeParse(c.req.query());
        if (!parsed.success) {
            return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
        }
        const result = await container.facturacion.consultarHistorialTurnos.execute({
            ...parsed.data,
            usuarioIdPeticion: obtenerIdentidad(c).usuarioId,
        });
        return presentResult(c, result);
    });
}

export function obtenerCorteTurnoController(container: AppContainer) {
    return safeHandler(async (c) => {
        const id = c.req.param('id');
        if (!id || id.trim() === '') {
            return c.json({ error: 'VALIDATION_ERROR', message: 'ID del turno requerido.' }, 400);
        }
        const result = await container.facturacion.obtenerCorteTurno.execute({
            turnoId: id,
            usuarioId: obtenerIdentidad(c).usuarioId,
        });
        return presentResult(c, result);
    });
}
