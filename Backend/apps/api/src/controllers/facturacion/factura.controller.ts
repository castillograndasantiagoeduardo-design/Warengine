import { AppContainer } from '@warengine/composition';
import { Factura } from '@warengine/core';
import {
    anularFacturaSchema,
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
        clienteNombre: factura.clienteNombre ?? undefined,
        clienteDocumento: factura.clienteDocumento ?? undefined,
        usuarioId: factura.usuarioId,
        cajeroNombre: factura.cajeroNombre ?? undefined,
        sucursalId: factura.sucursalId,
        turnoCajaId: factura.turnoCajaId,
        tipoVenta: (factura.tipoVenta as 'POS' | 'B2B') ?? undefined,
        subtotal: factura.subtotal,
        iva: factura.iva,
        total: factura.total,
        estado: factura.estado,
        fecha: factura.fecha instanceof Date ? factura.fecha.toISOString() : String(factura.fecha),
        items: factura.items.map((i): FacturaItemDto => ({
            id: i.id,
            productoId: i.productoId,
            productoNombre: i.productoNombre ?? undefined,
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
        devoluciones: factura.devoluciones?.map((d) => ({
            id: d.id,
            facturaId: d.facturaId,
            facturaItemId: d.facturaItemId,
            cantidad: d.cantidad,
            motivo: d.motivo,
            montoReembolso: d.montoReembolso,
            reingresaStock: d.reingresaStock,
            usuarioId: d.usuarioId,
            sucursalId: d.sucursalId,
            fecha: d.fecha instanceof Date ? d.fecha.toISOString() : String(d.fecha),
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
        const fechaInicio = parsed.data.desde ?? parsed.data.fechaInicio;
        const fechaFin = parsed.data.hasta ?? parsed.data.fechaFin;
        const result = await container.facturacion.listarFacturas.execute({
            clienteId: parsed.data.clienteId,
            sucursalId: parsed.data.sucursalId,
            fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
            fechaFin: fechaFin ? new Date(fechaFin) : undefined,
            estado: parsed.data.estado,
            texto: parsed.data.texto,
            tipo: parsed.data.tipo,
            page: parsed.data.page,
            limite: parsed.data.limite,
            offset: parsed.data.offset,
            actor,
        });
        if (result.isFailure) {
            return presentResult(c, result);
        }
        const val: any = result.value;
        const items = Array.isArray(val) ? val : (val?.items ?? []);
        const total = Array.isArray(val) ? items.length : (val?.total ?? items.length);
        const totalPaginas = Array.isArray(val) ? 1 : (val?.totalPaginas ?? 1);
        const page = Array.isArray(val) ? 1 : (val?.page ?? 1);
        const limite = Array.isArray(val) ? items.length : (val?.limite ?? 20);

        const itemsDto = items.map(toFacturaDto);
        return c.json({
            items: itemsDto,
            facturas: itemsDto, // retrocompatibilidad con pos.service.ts
            total,
            totalPaginas,
            page,
            limite,
        }, 200);
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

export function anularFacturaController(container: AppContainer) {
    return safeHandler(async (c) => {
        const id = c.req.param('id');
        if (!id || id.trim() === '') {
            return c.json({ error: 'VALIDATION_ERROR', message: 'ID de factura requerido.' }, 400);
        }
        const parsed = anularFacturaSchema.safeParse(await leerJson(c));
        if (!parsed.success) {
            return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
        }
        const actor = obtenerActor(c);
        const result = await container.facturacion.anularFactura.execute({
            id,
            motivo: parsed.data.motivo,
            actor,
        });
        if (result.isFailure) {
            return presentResult(c, result);
        }
        return c.json(
            {
                mensaje: `Factura ${result.value.consecutivo} anulada. El stock vendido fue reingresado al inventario.`,
                factura: toFacturaDto(result.value),
            },
            200,
        );
    });
}


