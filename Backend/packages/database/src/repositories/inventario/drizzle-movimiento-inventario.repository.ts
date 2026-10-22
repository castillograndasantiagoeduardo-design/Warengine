import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { Database } from '../../client.ts';
import {
  inventario_sucursal,
  movimientos_inventario,
  productos,
  proveedores,
} from '../../schema/inventario.schema.ts';
import { empleados, sucursales } from '../../schema/administracion.schema.ts';
import { usuarios } from '../../schema/autenticacion.schema.ts';
import {
  DatosAnulacionEntrada,
  DatosRegistroAjuste,
  DatosRegistroEntrada,
  DatosRegistroSalida,
  DatosTransferenciaMercancia,
  EntradaNoEncontradaError,
  EntradaYaAnuladaError,
  FiltrosKardex,
  IMovimientoInventarioRepository,
  ItemKardex,
  MovimientoInventario,
  ResultadoTransferenciaMercancia,
  StockInsuficienteError,
} from '@warengine/core';

export class DrizzleMovimientoInventarioRepository implements IMovimientoInventarioRepository {
  constructor(private readonly db: Database) {}

  public async obtenerStockActual(productoId: string, sucursalId: number): Promise<number> {
    const [row] = await this.db
      .select({ stockActual: inventario_sucursal.stock_actual })
      .from(inventario_sucursal)
      .where(
        and(
          eq(inventario_sucursal.producto_id, productoId),
          eq(inventario_sucursal.sucursal_id, sucursalId),
        ),
      );
    return row?.stockActual ?? 0;
  }

  public async registrarEntrada(datos: DatosRegistroEntrada): Promise<MovimientoInventario> {
    return await this.db.transaction(async (tx) => {
      // 1. Registrar movimiento inmutable en kardex.
      // NOTA: El trigger de BD `trg_movimientos_actualiza_stock` (AFTER INSERT)
      // es la única fuente de verdad y actualiza o crea automáticamente `inventario_sucursal.stock_actual`.
      const id = crypto.randomUUID();
      const fecha = new Date();

      await tx.insert(movimientos_inventario).values({
        id_movimiento_inventario: id,
        producto_id: datos.productoId,
        sucursal_id: datos.sucursalId,
        tipo: 'entrada',
        cantidad: datos.cantidad,
        motivo: datos.motivo ?? null,
        proveedor_id: datos.proveedorId ?? null,
        usuario_id: datos.usuarioId,
        fecha,
      });

      // 3. Obtener el stock resultante
      const [inv] = await tx
        .select({ stockActual: inventario_sucursal.stock_actual })
        .from(inventario_sucursal)
        .where(
          and(
            eq(inventario_sucursal.producto_id, datos.productoId),
            eq(inventario_sucursal.sucursal_id, datos.sucursalId),
          ),
        );

      return {
        id,
        productoId: datos.productoId,
        sucursalId: datos.sucursalId,
        tipo: 'entrada',
        cantidad: datos.cantidad,
        motivo: datos.motivo ?? null,
        proveedorId: datos.proveedorId ?? null,
        usuarioId: datos.usuarioId,
        fecha,
        stockResultante: inv?.stockActual ?? datos.cantidad,
      };
    });
  }

  public async registrarSalida(datos: DatosRegistroSalida): Promise<MovimientoInventario> {
    return await this.db.transaction(async (tx) => {
      // 1. Verificar existencias actuales en la sucursal
      const [inv] = await tx
        .select({ stockActual: inventario_sucursal.stock_actual })
        .from(inventario_sucursal)
        .where(
          and(
            eq(inventario_sucursal.producto_id, datos.productoId),
            eq(inventario_sucursal.sucursal_id, datos.sucursalId),
          ),
        );

      const stockActual = inv?.stockActual ?? 0;
      if (stockActual < datos.cantidad) {
        throw new StockInsuficienteError(stockActual, datos.cantidad);
      }

      // 2. Registrar movimiento inmutable en kardex.
      // NOTA: El trigger de BD `trg_movimientos_actualiza_stock` (AFTER INSERT)
      // es la única fuente de verdad y descuenta automáticamente `inventario_sucursal.stock_actual`.
      const id = crypto.randomUUID();
      const fecha = new Date();

      await tx.insert(movimientos_inventario).values({
        id_movimiento_inventario: id,
        producto_id: datos.productoId,
        sucursal_id: datos.sucursalId,
        tipo: 'salida',
        cantidad: datos.cantidad,
        motivo: datos.motivo,
        usuario_id: datos.usuarioId,
        fecha,
      });

      // 3. Obtener el stock resultante actualizado por el trigger
      const [invFinal] = await tx
        .select({ stockActual: inventario_sucursal.stock_actual })
        .from(inventario_sucursal)
        .where(
          and(
            eq(inventario_sucursal.producto_id, datos.productoId),
            eq(inventario_sucursal.sucursal_id, datos.sucursalId),
          ),
        );

      return {
        id,
        productoId: datos.productoId,
        sucursalId: datos.sucursalId,
        tipo: 'salida',
        cantidad: datos.cantidad,
        motivo: datos.motivo,
        usuarioId: datos.usuarioId,
        fecha,
        stockResultante: invFinal?.stockActual ?? (stockActual - datos.cantidad),
      };
    });
  }

  /**
   * RF-ADM-B10: Consulta paginada del histórico de movimientos (Kardex).
   * Devuelve entradas, salidas y ajustes ordenados cronológicamente descendente.
   */
  public async consultarKardex(filtros: FiltrosKardex): Promise<{ items: ItemKardex[]; total: number }> {
    const conditions = [];

    if (filtros.productoId) {
      conditions.push(eq(movimientos_inventario.producto_id, filtros.productoId));
    }

    if (filtros.sucursalId !== undefined) {
      conditions.push(eq(movimientos_inventario.sucursal_id, filtros.sucursalId));
    } else if (filtros.sucursalIds && filtros.sucursalIds.length > 0) {
      conditions.push(inArray(movimientos_inventario.sucursal_id, filtros.sucursalIds));
    }

    if (filtros.tipo) {
      conditions.push(eq(movimientos_inventario.tipo, filtros.tipo));
    }

    if (filtros.proveedorId !== undefined) {
      conditions.push(eq(movimientos_inventario.proveedor_id, filtros.proveedorId));
    }

    if (filtros.desde) {
      conditions.push(gte(movimientos_inventario.fecha, filtros.desde));
    }

    if (filtros.hasta) {
      conditions.push(lte(movimientos_inventario.fecha, filtros.hasta));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 1. Conteo total de registros que cumplen los filtros
    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(movimientos_inventario)
      .where(whereClause);
    const total = Number(countResult?.count ?? 0);

    // 2. Consulta de registros con información legible de producto, sucursal, proveedor y responsable
    const rows = await this.db
      .select({
        id: movimientos_inventario.id_movimiento_inventario,
        productoId: movimientos_inventario.producto_id,
        productoNombre: productos.nombre,
        productoSku: productos.sku,
        sucursalId: movimientos_inventario.sucursal_id,
        sucursalNombre: sucursales.nombre,
        tipo: movimientos_inventario.tipo,
        cantidad: movimientos_inventario.cantidad,
        motivo: movimientos_inventario.motivo,
        proveedorId: movimientos_inventario.proveedor_id,
        proveedorNombre: proveedores.nombre,
        facturaId: movimientos_inventario.factura_id,
        devolucionId: movimientos_inventario.devolucion_id,
        usuarioId: movimientos_inventario.usuario_id,
        usuarioNombre: empleados.nombre,
        fecha: movimientos_inventario.fecha,
      })
      .from(movimientos_inventario)
      .leftJoin(productos, eq(movimientos_inventario.producto_id, productos.id_producto))
      .leftJoin(sucursales, eq(movimientos_inventario.sucursal_id, sucursales.id_sucursal))
      .leftJoin(proveedores, eq(movimientos_inventario.proveedor_id, proveedores.id_proveedor))
      .leftJoin(usuarios, eq(movimientos_inventario.usuario_id, usuarios.id_usuario))
      .leftJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
      .where(whereClause)
      .orderBy(desc(movimientos_inventario.fecha))
      .limit(filtros.limit)
      .offset(filtros.offset);

    const items: ItemKardex[] = rows.map((r) => ({
      id: r.id,
      productoId: r.productoId,
      productoNombre: r.productoNombre ?? undefined,
      productoSku: r.productoSku ?? undefined,
      sucursalId: r.sucursalId,
      sucursalNombre: r.sucursalNombre ?? undefined,
      tipo: r.tipo as 'entrada' | 'salida' | 'ajuste_entrada' | 'ajuste_salida',
      cantidad: r.cantidad,
      motivo: r.motivo,
      proveedorId: r.proveedorId,
      proveedorNombre: r.proveedorNombre,
      facturaId: r.facturaId,
      devolucionId: r.devolucionId,
      usuarioId: r.usuarioId,
      usuarioNombre: r.usuarioNombre,
      fecha: r.fecha,
    }));

    return { items, total };
  }

  /**
   * RF-ADM-B15: Consulta un movimiento de inventario por su ID único.
   */
  public async obtenerPorId(id: string): Promise<ItemKardex | null> {
    const [row] = await this.db
      .select({
        id: movimientos_inventario.id_movimiento_inventario,
        productoId: movimientos_inventario.producto_id,
        productoNombre: productos.nombre,
        productoSku: productos.sku,
        sucursalId: movimientos_inventario.sucursal_id,
        sucursalNombre: sucursales.nombre,
        tipo: movimientos_inventario.tipo,
        cantidad: movimientos_inventario.cantidad,
        motivo: movimientos_inventario.motivo,
        proveedorId: movimientos_inventario.proveedor_id,
        proveedorNombre: proveedores.nombre,
        facturaId: movimientos_inventario.factura_id,
        devolucionId: movimientos_inventario.devolucion_id,
        usuarioId: movimientos_inventario.usuario_id,
        usuarioNombre: empleados.nombre,
        fecha: movimientos_inventario.fecha,
      })
      .from(movimientos_inventario)
      .leftJoin(productos, eq(movimientos_inventario.producto_id, productos.id_producto))
      .leftJoin(sucursales, eq(movimientos_inventario.sucursal_id, sucursales.id_sucursal))
      .leftJoin(proveedores, eq(movimientos_inventario.proveedor_id, proveedores.id_proveedor))
      .leftJoin(usuarios, eq(movimientos_inventario.usuario_id, usuarios.id_usuario))
      .leftJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
      .where(eq(movimientos_inventario.id_movimiento_inventario, id));

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      productoId: row.productoId,
      productoNombre: row.productoNombre ?? undefined,
      productoSku: row.productoSku ?? undefined,
      sucursalId: row.sucursalId,
      sucursalNombre: row.sucursalNombre ?? undefined,
      tipo: row.tipo as 'entrada' | 'salida' | 'ajuste_entrada' | 'ajuste_salida',
      cantidad: row.cantidad,
      motivo: row.motivo,
      proveedorId: row.proveedorId,
      proveedorNombre: row.proveedorNombre,
      facturaId: row.facturaId,
      devolucionId: row.devolucionId,
      usuarioId: row.usuarioId,
      usuarioNombre: row.usuarioNombre,
      fecha: row.fecha,
    };
  }

  /**
   * RF-ADM-B16: Verifica si ya existe un movimiento compensatorio de anulación para esta entrada.
   */
  public async estaEntradaAnulada(entradaId: string): Promise<boolean> {
    const patronMotivo = `Anulación de entrada ${entradaId}%`;
    const [row] = await this.db
      .select({ id: movimientos_inventario.id_movimiento_inventario })
      .from(movimientos_inventario)
      .where(sql`${movimientos_inventario.motivo} LIKE ${patronMotivo}`)
      .limit(1);
    return row !== undefined;
  }

  /**
   * RF-ADM-B16: Anula una entrada de mercancía de forma transaccional y compensatoria.
   */
  public async anularEntrada(
    entradaId: string,
    datos: DatosAnulacionEntrada,
  ): Promise<MovimientoInventario> {
    return await this.db.transaction(async (tx) => {
      // 1. Obtener la entrada
      const [entrada] = await tx
        .select()
        .from(movimientos_inventario)
        .where(eq(movimientos_inventario.id_movimiento_inventario, entradaId));

      if (!entrada || entrada.tipo !== 'entrada') {
        throw new EntradaNoEncontradaError();
      }

      // 2. Verificar que no esté ya anulada
      const patronMotivo = `Anulación de entrada ${entradaId}%`;
      const [yaAnulada] = await tx
        .select({ id: movimientos_inventario.id_movimiento_inventario })
        .from(movimientos_inventario)
        .where(sql`${movimientos_inventario.motivo} LIKE ${patronMotivo}`)
        .limit(1);

      if (yaAnulada) {
        throw new EntradaYaAnuladaError();
      }

      // 3. Verificar stock actual en la sucursal
      const [inv] = await tx
        .select({ stockActual: inventario_sucursal.stock_actual })
        .from(inventario_sucursal)
        .where(
          and(
            eq(inventario_sucursal.producto_id, entrada.producto_id),
            eq(inventario_sucursal.sucursal_id, entrada.sucursal_id),
          ),
        );

      const stockActual = inv?.stockActual ?? 0;
      if (stockActual < entrada.cantidad) {
        throw new StockInsuficienteError(
          `No se puede anular la entrada: el stock actual (${stockActual}) es menor a la cantidad a revertir (${entrada.cantidad}).`,
        );
      }

      // 4. Insertar movimiento compensatorio inmutable en kardex.
      // NOTA: El trigger `trg_movimientos_actualiza_stock` descuenta el stock automáticamente.
      const idCompensatorio = crypto.randomUUID();
      const fecha = new Date();
      const motivoCompensatorio = `Anulación de entrada ${entradaId}: ${datos.motivo}`;

      await tx.insert(movimientos_inventario).values({
        id_movimiento_inventario: idCompensatorio,
        producto_id: entrada.producto_id,
        sucursal_id: entrada.sucursal_id,
        tipo: 'salida',
        cantidad: entrada.cantidad,
        motivo: motivoCompensatorio,
        proveedor_id: entrada.proveedor_id,
        usuario_id: datos.usuarioId,
        fecha,
      });

      const [invFinal] = await tx
        .select({ stockActual: inventario_sucursal.stock_actual })
        .from(inventario_sucursal)
        .where(
          and(
            eq(inventario_sucursal.producto_id, entrada.producto_id),
            eq(inventario_sucursal.sucursal_id, entrada.sucursal_id),
          ),
        );

      return {
        id: idCompensatorio,
        productoId: entrada.producto_id,
        sucursalId: entrada.sucursal_id,
        tipo: 'salida',
        cantidad: entrada.cantidad,
        motivo: motivoCompensatorio,
        proveedorId: entrada.proveedor_id,
        usuarioId: datos.usuarioId,
        fecha,
        stockResultante: invFinal?.stockActual ?? (stockActual - entrada.cantidad),
      };
    });
  }

  public async registrarAjuste(datos: DatosRegistroAjuste): Promise<MovimientoInventario> {
    return await this.db.transaction(async (tx) => {
      // 1. Si es ajuste_salida, verificar existencia previa para lanzar error de dominio claro si es insuficiente
      if (datos.tipo === 'ajuste_salida') {
        const [inv] = await tx
          .select({ stockActual: inventario_sucursal.stock_actual })
          .from(inventario_sucursal)
          .where(
            and(
              eq(inventario_sucursal.producto_id, datos.productoId),
              eq(inventario_sucursal.sucursal_id, datos.sucursalId),
            ),
          );

        const stockActual = inv?.stockActual ?? 0;
        if (stockActual < datos.cantidad) {
          throw new StockInsuficienteError(
            `No se puede realizar el ajuste de salida: el stock actual (${stockActual}) es menor a la cantidad a descontar (${datos.cantidad}).`,
          );
        }
      }

      // 2. Registrar movimiento inmutable en kardex.
      // NOTA: El trigger de BD `trg_movimientos_actualiza_stock` (AFTER INSERT)
      // es la única fuente de verdad y actualiza automáticamente `inventario_sucursal.stock_actual`.
      const id = crypto.randomUUID();
      const fecha = new Date();

      await tx.insert(movimientos_inventario).values({
        id_movimiento_inventario: id,
        producto_id: datos.productoId,
        sucursal_id: datos.sucursalId,
        tipo: datos.tipo,
        cantidad: datos.cantidad,
        motivo: datos.motivo,
        usuario_id: datos.usuarioId,
        fecha,
      });

      // 3. Obtener el stock resultante
      const [invFinal] = await tx
        .select({ stockActual: inventario_sucursal.stock_actual })
        .from(inventario_sucursal)
        .where(
          and(
            eq(inventario_sucursal.producto_id, datos.productoId),
            eq(inventario_sucursal.sucursal_id, datos.sucursalId),
          ),
        );

      return {
        id,
        productoId: datos.productoId,
        sucursalId: datos.sucursalId,
        tipo: datos.tipo,
        cantidad: datos.cantidad,
        motivo: datos.motivo,
        usuarioId: datos.usuarioId,
        fecha,
        stockResultante: invFinal?.stockActual ?? 0,
      };
    });
  }

  public async transferirMercancia(datos: DatosTransferenciaMercancia): Promise<ResultadoTransferenciaMercancia> {
    return await this.db.transaction(async (tx) => {
      // 1. Verificar stock actual en la sucursal de origen
      const [invOrigen] = await tx
        .select({ stockActual: inventario_sucursal.stock_actual })
        .from(inventario_sucursal)
        .where(
          and(
            eq(inventario_sucursal.producto_id, datos.productoId),
            eq(inventario_sucursal.sucursal_id, datos.sucursalOrigenId),
          ),
        );

      const stockActualOrigen = invOrigen?.stockActual ?? 0;
      if (stockActualOrigen < datos.cantidad) {
        throw new StockInsuficienteError(
          `Stock insuficiente en sucursal origen (${stockActualOrigen}) para transferir (${datos.cantidad}).`,
        );
      }

      // 2. Registrar movimientos inmutables en kardex.
      // NOTA: El trigger de BD `trg_movimientos_actualiza_stock` descuenta automáticamente de origen (salida)
      // e incrementa/crea en destino (entrada).
      const movimientoSalidaId = crypto.randomUUID();
      const movimientoEntradaId = crypto.randomUUID();
      const fecha = new Date();

      const motivoSalida = datos.motivo
        ? `Transferencia a sucursal ${datos.sucursalDestinoId}: ${datos.motivo}`
        : `Transferencia a sucursal ${datos.sucursalDestinoId}`;

      const motivoEntrada = datos.motivo
        ? `Transferencia desde sucursal ${datos.sucursalOrigenId}: ${datos.motivo}`
        : `Transferencia desde sucursal ${datos.sucursalOrigenId}`;

      // 4.1 Movimiento de salida en origen
      await tx.insert(movimientos_inventario).values({
        id_movimiento_inventario: movimientoSalidaId,
        producto_id: datos.productoId,
        sucursal_id: datos.sucursalOrigenId,
        tipo: 'salida',
        cantidad: datos.cantidad,
        motivo: motivoSalida,
        usuario_id: datos.usuarioId,
        fecha,
      });

      // 4.2 Movimiento de entrada en destino
      await tx.insert(movimientos_inventario).values({
        id_movimiento_inventario: movimientoEntradaId,
        producto_id: datos.productoId,
        sucursal_id: datos.sucursalDestinoId,
        tipo: 'entrada',
        cantidad: datos.cantidad,
        motivo: motivoEntrada,
        usuario_id: datos.usuarioId,
        fecha,
      });

      // 3. Consultar stocks resultantes actualizados por los triggers
      const [invOrigenFinal] = await tx
        .select({ stockActual: inventario_sucursal.stock_actual })
        .from(inventario_sucursal)
        .where(
          and(
            eq(inventario_sucursal.producto_id, datos.productoId),
            eq(inventario_sucursal.sucursal_id, datos.sucursalOrigenId),
          ),
        );

      const [invDestinoFinal] = await tx
        .select({ stockActual: inventario_sucursal.stock_actual })
        .from(inventario_sucursal)
        .where(
          and(
            eq(inventario_sucursal.producto_id, datos.productoId),
            eq(inventario_sucursal.sucursal_id, datos.sucursalDestinoId),
          ),
        );

      return {
        movimientoSalidaId,
        movimientoEntradaId,
        productoId: datos.productoId,
        sucursalOrigenId: datos.sucursalOrigenId,
        sucursalDestinoId: datos.sucursalDestinoId,
        cantidad: datos.cantidad,
        stockRestanteOrigen: invOrigenFinal?.stockActual ?? (stockActualOrigen - datos.cantidad),
        stockResultanteDestino: invDestinoFinal?.stockActual ?? datos.cantidad,
        fecha,
      };
    });
  }
}

