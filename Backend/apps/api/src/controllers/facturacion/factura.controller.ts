import { AppContainer } from '@warengine/composition';
import { Factura } from '@warengine/core';
import {
    crearFacturaSchema,
    FacturaDto,
    FacturaItemDto,
    FacturaPagoDto,
    listarFacturasQuerySchema,
} from '@warengine/contracts';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';

export function toFacturaDto(factura: Factura): FacturaDto {
    return {
        id: factura.id,
        consecutivo: factura.consecutivo,
        clienteId: factura.clienteId,
        usuarioId: factura.usuarioId,
        sucursalId: factura.sucursalId,
        turnoCajaId: factura.turnoCajaId,
        subtotal: factura.subtotal,
        iva: factura.iva,
        total: factura.total,
        estado: factura.estado,
        fecha: factura.fecha instanceof Date ? factura.fecha.toISOString() : String(factura.fecha),
        items: factura.items.map((i): FacturaItemDto => ({
            id: i.id,
            productoId: i.productoId,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario,
            descuento: i.descuento,
            subtotal: i.subtotal,
        })),
        pagos: factura.pagos.map((p): FacturaPagoDto => ({
            id: p.id,
            medioPago: p.medioPago,
            monto: p.monto,
            referenciaTransaccion: p.referenciaTransaccion,
            fecha: p.fecha instanceof Date ? p.fecha.toISOString() : String(p.fecha),
        })),
    };
}

export function crearFacturaController(container: AppContainer, esB2B = false) {
    return safeHandler(async (c) => {
        const parsed = crearFacturaSchema.safeParse(await leerJson(c));
        if (!parsed.success) {
            return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
        }
        const actor = obtenerActor(c);
        const result = await container.facturacion.crearFactura.execute({
            clienteId: parsed.data.clienteId,
            items: parsed.data.items,
            pagos: parsed.data.pagos,
            esB2B: esB2B || (parsed.data.esB2B ?? false),
            actor,
        });
        if (result.isFailure) {
            return presentResult(c, result);
        }
        return c.json(toFacturaDto(result.value), 201);
    });
}

export function listarFacturasController(container: AppContainer) {
    return safeHandler(async (c) => {
        const parsed = listarFacturasQuerySchema.safeParse(c.req.query());
        if (!parsed.success) {
            return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
        }
        const actor = obtenerActor(c);
        const result = await container.facturacion.listarFacturas.execute({
            clienteId: parsed.data.clienteId,
            sucursalId: parsed.data.sucursalId,
            fechaInicio: parsed.data.fechaInicio ? new Date(parsed.data.fechaInicio) : undefined,
            fechaFin: parsed.data.fechaFin ? new Date(parsed.data.fechaFin) : undefined,
            estado: parsed.data.estado,
            limite: parsed.data.limite,
            offset: parsed.data.offset,
            actor,
        });
        if (result.isFailure) {
            return presentResult(c, result);
        }
        return c.json(result.value.map(toFacturaDto), 200);
    });
}

export function obtenerFacturaPorIdController(container: AppContainer) {
    return safeHandler(async (c) => {
        const id = c.req.param('id');
        if (!id || id.trim() === '') {
            return c.json({ error: 'VALIDATION_ERROR', message: 'ID de factura requerido.' }, 400);
        }
        const actor = obtenerActor(c);
        const result = await container.facturacion.obtenerFacturaPorId.execute({
            id,
            actor,
        });
        if (result.isFailure) {
            return presentResult(c, result);
        }
        return c.json(toFacturaDto(result.value), 200);
    });
}

