import { AppContainer } from '@warengine/composition';
import { DevolucionVenta } from '@warengine/core';
import { DevolucionVentaDto, registrarDevolucionSchema } from '@warengine/contracts';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';

export function toDevolucionVentaDto(d: DevolucionVenta): DevolucionVentaDto {
    return {
        id: d.id, facturaId: d.facturaId, facturaItemId: d.facturaItemId,
        cantidad: d.cantidad, motivo: d.motivo, montoReembolso: d.montoReembolso,
        reingresaStock: d.reingresaStock, usuarioId: d.usuarioId, sucursalId: d.sucursalId,
        fecha: d.fecha instanceof Date ? d.fecha.toISOString() : String(d.fecha),
    };
}

export function registrarDevolucionController(container: AppContainer) {
    return safeHandler(async (c) => {
        const facturaId = c.req.param('id');
        if (!facturaId?.trim()) {
            return c.json({ error: 'VALIDATION_ERROR', message: 'ID de factura requerido.' }, 400);
        }
        const parsed = registrarDevolucionSchema.safeParse(await leerJson(c));
        if (!parsed.success) {
            return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
        }
        const result = await container.facturacion.registrarDevolucion.execute({
            facturaId, ...parsed.data, actor: obtenerActor(c),
        });
        if (result.isFailure) return presentResult(c, result);
        const lineas = result.value.map(toDevolucionVentaDto);
        const totalReembolso = Math.round(lineas.reduce((a, l) => a + l.montoReembolso, 0) * 100) / 100;
        return c.json({ facturaId, totalReembolso, lineas }, 201);
    });
}