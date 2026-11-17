import { and, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import type { EstadoPedidoB2B } from '@warengine/contracts';
import {
  CotizacionB2B,
  CotizacionB2BItem,
  type CrearCotizacionB2BDatos,
  type FiltrosCotizacionesB2B,
  type ICotizacionB2BRepository,
} from '@warengine/core';
import { Database } from '../../client.ts';
import {
  clientes,
  cotizacion_b2b_items,
  cotizaciones_b2b,
} from '../../schema/facturacion.schema.ts';
import { productos } from '../../schema/inventario.schema.ts';
import { sucursales } from '../../schema/administracion.schema.ts';
import { usuarios } from '../../schema/autenticacion.schema.ts';
import {
  cotizacionB2BFromRow,
  cotizacionB2BItemFromRow,
} from '../../mappers/facturacion/cotizacion-b2b.mapper.ts';

export class DrizzleCotizacionB2BRepository implements ICotizacionB2BRepository {
  constructor(private readonly db: Database) {}

  public async crear(datos: CrearCotizacionB2BDatos): Promise<CotizacionB2B> {
    const cotizacionId = datos.cotizacion.id;

    await this.db.transaction(async (tx) => {
      const [maxRow] = await tx
        .select({ maxConsecutivo: sql<number>`COALESCE(MAX(${cotizaciones_b2b.consecutivo}), 0)` })
        .from(cotizaciones_b2b)
        .where(eq(cotizaciones_b2b.sucursal_id, datos.cotizacion.sucursalId));
      const consecutivo = Number(maxRow?.maxConsecutivo ?? 0) + 1;

      await tx.insert(cotizaciones_b2b).values({
        id_cotizacion: cotizacionId,
        consecutivo,
        cliente_id: datos.cotizacion.clienteId,
        vendedor_id: datos.cotizacion.vendedorId,
        sucursal_id: datos.cotizacion.sucursalId,
        subtotal: datos.cotizacion.subtotal.toFixed(2),
        iva: datos.cotizacion.iva.toFixed(2),
        total: datos.cotizacion.total.toFixed(2),
        medio_pago_sugerido: datos.cotizacion.medioPagoSugerido,
        referencia_pago: datos.cotizacion.referenciaPago,
        estado: datos.cotizacion.estado,
        estado_pedido: datos.cotizacion.estadoPedido,
        valida_hasta: datos.cotizacion.validaHasta,
        observaciones: datos.cotizacion.observaciones,
      });

      for (const item of datos.items) {
        await tx.insert(cotizacion_b2b_items).values({
          id_cotizacion_item: item.id,
          cotizacion_id: cotizacionId,
          producto_id: item.productoId,
          cantidad: item.cantidad,
          precio_unitario: item.precioUnitario.toFixed(2),
          descuento: item.descuento.toFixed(2),
          subtotal: item.subtotal.toFixed(2),
        });
      }
    });

    const guardada = await this.findById(cotizacionId);
    if (!guardada) {
      throw new Error(`No se pudo recuperar la cotización B2B recién creada: ${cotizacionId}`);
    }
    return guardada;
  }

  public async findById(id: string): Promise<CotizacionB2B | null> {
    const [row] = await this.db
      .select()
      .from(cotizaciones_b2b)
      .where(eq(cotizaciones_b2b.id_cotizacion, id))
      .limit(1);

    if (!row) return null;
    const hidratadas = await this.hidratar([row]);
    return hidratadas[0] ?? null;
  }

  public async listar(filtros: FiltrosCotizacionesB2B): Promise<CotizacionB2B[]> {
    const condiciones: SQL[] = [];

    if (filtros.sucursalIds !== undefined) {
      if (filtros.sucursalIds.length === 0) return [];
      condiciones.push(inArray(cotizaciones_b2b.sucursal_id, filtros.sucursalIds));
    }
    if (filtros.vendedorId) {
      condiciones.push(eq(cotizaciones_b2b.vendedor_id, filtros.vendedorId));
    }
    if (filtros.clienteId) {
      condiciones.push(eq(cotizaciones_b2b.cliente_id, filtros.clienteId));
    }
    if (filtros.estado) {
      condiciones.push(eq(cotizaciones_b2b.estado, filtros.estado));
    }
    if (filtros.estadoPedido) {
      condiciones.push(eq(cotizaciones_b2b.estado_pedido, filtros.estadoPedido));
    }

    const rows = await this.db
      .select()
      .from(cotizaciones_b2b)
      .where(condiciones.length > 0 ? and(...condiciones) : undefined)
      .orderBy(desc(cotizaciones_b2b.created_at))
      .limit(filtros.limite)
      .offset(filtros.offset);

    if (rows.length === 0) return [];
    return await this.hidratar(rows);
  }

  public async otorgarAval(
    id: string,
    aprobadoPor: string,
    fechaAval: Date,
  ): Promise<CotizacionB2B | null> {
    const [resultado] = await this.db
      .update(cotizaciones_b2b)
      .set({
        estado: 'aprobada',
        aprobado_por: aprobadoPor,
        fecha_aval: fechaAval,
        motivo_rechazo: null,
        updated_at: fechaAval,
      })
      .where(
        and(
          eq(cotizaciones_b2b.id_cotizacion, id),
          eq(cotizaciones_b2b.estado, 'pendiente_aval'),
        ),
      );

    if (Number(resultado.affectedRows) === 0) return null;
    return await this.findById(id);
  }

  public async rechazar(
    id: string,
    rechazadoPor: string,
    fechaAval: Date,
    motivoRechazo: string,
  ): Promise<CotizacionB2B | null> {
    const [resultado] = await this.db
      .update(cotizaciones_b2b)
      .set({
        estado: 'rechazada',
        aprobado_por: rechazadoPor,
        fecha_aval: fechaAval,
        motivo_rechazo: motivoRechazo,
        updated_at: fechaAval,
      })
      .where(
        and(
          eq(cotizaciones_b2b.id_cotizacion, id),
          eq(cotizaciones_b2b.estado, 'pendiente_aval'),
        ),
      );

    if (Number(resultado.affectedRows) === 0) return null;
    return await this.findById(id);
  }

  public async marcarFacturadaYEnProceso(
    id: string,
    facturaId: string,
  ): Promise<CotizacionB2B | null> {
    const ahora = new Date();
    const [resultado] = await this.db
      .update(cotizaciones_b2b)
      .set({
        estado: 'facturada',
        estado_pedido: 'en_proceso',
        factura_id: facturaId,
        updated_at: ahora,
      })
      .where(
        and(
          eq(cotizaciones_b2b.id_cotizacion, id),
          eq(cotizaciones_b2b.estado, 'aprobada'),
        ),
      );

    if (Number(resultado.affectedRows) === 0) return null;
    return await this.findById(id);
  }

  public async actualizarEstadoPedido(
    id: string,
    estadoPedido: EstadoPedidoB2B,
  ): Promise<CotizacionB2B | null> {
    const [resultado] = await this.db
      .update(cotizaciones_b2b)
      .set({
        estado_pedido: estadoPedido,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(cotizaciones_b2b.id_cotizacion, id),
          eq(cotizaciones_b2b.estado, 'facturada'),
        ),
      );

    if (Number(resultado.affectedRows) === 0) return null;
    return await this.findById(id);
  }

  private async hidratar(
    rows: (typeof cotizaciones_b2b.$inferSelect)[],
  ): Promise<CotizacionB2B[]> {
    const ids = rows.map((r) => r.id_cotizacion);
    const clienteIds = [...new Set(rows.map((r) => r.cliente_id))];
    const sucursalIds = [...new Set(rows.map((r) => r.sucursal_id))];
    const usuarioIds = [
      ...new Set(
        rows.flatMap((r) => (r.aprobado_por ? [r.vendedor_id, r.aprobado_por] : [r.vendedor_id])),
      ),
    ];

    const [itemRows, clienteRows, sucursalRows, usuarioRows] = await Promise.all([
      this.db
        .select({
          item: cotizacion_b2b_items,
          productoNombre: productos.nombre,
          productoSku: productos.sku,
        })
        .from(cotizacion_b2b_items)
        .innerJoin(productos, eq(cotizacion_b2b_items.producto_id, productos.id_producto))
        .where(inArray(cotizacion_b2b_items.cotizacion_id, ids)),
      this.db
        .select({
          id: clientes.id_cliente,
          nombre: clientes.nombre_razon_social,
          tipoDoc: clientes.tipo_documento,
          numDoc: clientes.numero_documento,
        })
        .from(clientes)
        .where(inArray(clientes.id_cliente, clienteIds)),
      this.db
        .select({ id: sucursales.id_sucursal, nombre: sucursales.nombre })
        .from(sucursales)
        .where(inArray(sucursales.id_sucursal, sucursalIds)),
      this.db
        .select({ id: usuarios.id_usuario, email: usuarios.email })
        .from(usuarios)
        .where(inArray(usuarios.id_usuario, usuarioIds)),
    ]);

    const itemsPorCotizacion = new Map<string, CotizacionB2BItem[]>();
    for (const r of itemRows) {
      const lista = itemsPorCotizacion.get(r.item.cotizacion_id) ?? [];
      lista.push(
        cotizacionB2BItemFromRow(r.item, {
          productoNombre: r.productoNombre,
          productoSku: r.productoSku,
        }),
      );
      itemsPorCotizacion.set(r.item.cotizacion_id, lista);
    }

    const clienteMap = new Map(clienteRows.map((c) => [c.id, c]));
    const sucursalMap = new Map(sucursalRows.map((s) => [s.id, s.nombre]));
    const usuarioMap = new Map(usuarioRows.map((u) => [u.id, u.email]));

    return rows.map((row) => {
      const cli = clienteMap.get(row.cliente_id);
      return cotizacionB2BFromRow(row, itemsPorCotizacion.get(row.id_cotizacion) ?? [], {
        clienteNombre: cli?.nombre ?? null,
        clienteDocumento: cli ? `${cli.tipoDoc} ${cli.numDoc}` : null,
        vendedorEmail: usuarioMap.get(row.vendedor_id) ?? null,
        sucursalNombre: sucursalMap.get(row.sucursal_id) ?? null,
        aprobadoPorEmail: row.aprobado_por ? usuarioMap.get(row.aprobado_por) ?? null : null,
      });
    });
  }
}
