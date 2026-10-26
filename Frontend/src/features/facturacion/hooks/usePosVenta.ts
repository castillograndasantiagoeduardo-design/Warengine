'use client';

/**
 * usePosVenta.ts — Hook para gestionar el carrito de venta activa del terminal POS.
 *
 * Principio SOLID:
 * - Single Responsibility: Mantiene el estado en memoria de los ítems agregados,
 *   sus cantidades, descuentos y los cálculos financieros con precisión decimal.
 */

import { useState, useCallback, useMemo } from 'react';
import type { ProductoPos, ItemCarritoPos } from '../types/pos.types';

export function usePosVenta() {
  const [items, setItems] = useState<ItemCarritoPos[]>([]);

  /**
   * Añade un producto al carrito o incrementa su cantidad si ya existe.
   */
  const agregarProducto = useCallback((producto: ProductoPos, cantidad: number = 1) => {
    setItems((actuales) => {
      const index = actuales.findIndex((i) => i.productoId === producto.id);
      if (index >= 0) {
        const itemActual = actuales[index];
        // Nunca más unidades que las existencias reales de la sede (el trigger de BD también lo valida)
        const nuevaCantidad = Math.min(itemActual.cantidad + cantidad, itemActual.stockDisponible);
        if (nuevaCantidad === itemActual.cantidad) return actuales;
        const subtotal = Math.round(nuevaCantidad * itemActual.precioUnitario * 100) / 100;

        const copia = [...actuales];
        copia[index] = {
          ...itemActual,
          cantidad: nuevaCantidad,
          subtotal,
        };
        return copia;
      }

      if (producto.stockActual <= 0) return actuales;
      cantidad = Math.min(cantidad, producto.stockActual);
      const subtotal = Math.round(cantidad * producto.precioVenta * 100) / 100;
      return [
        ...actuales,
        {
          productoId: producto.id,
          sku: producto.sku,
          nombre: producto.nombre,
          precioUnitario: producto.precioVenta,
          cantidad,
          stockDisponible: producto.stockActual,
          descuento: 0,
          subtotal,
        },
      ];
    });
  }, []);

  /**
   * Modifica directamente la cantidad de un producto en el carrito.
   */
  const actualizarCantidad = useCallback((productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      setItems((actuales) => actuales.filter((i) => i.productoId !== productoId));
      return;
    }

    setItems((actuales) =>
      actuales.map((i) => {
        if (i.productoId !== productoId) return i;
        const cantidadValida = Math.min(cantidad, i.stockDisponible);
        const subtotal = Math.round(cantidadValida * i.precioUnitario * 100) / 100;
        return {
          ...i,
          cantidad: cantidadValida,
          subtotal,
        };
      }),
    );
  }, []);

  /**
   * Aplica un descuento en valor absoluto o porcentaje al ítem.
   */
  const actualizarDescuento = useCallback((productoId: string, descuento: number) => {
    setItems((actuales) =>
      actuales.map((i) => {
        if (i.productoId !== productoId) return i;
        const subtotalBruto = i.cantidad * i.precioUnitario;
        const subtotal = Math.max(0, Math.round((subtotalBruto - descuento) * 100) / 100);
        return {
          ...i,
          descuento,
          subtotal,
        };
      }),
    );
  }, []);

  /**
   * Remueve un ítem del carrito.
   */
  const eliminarItem = useCallback((productoId: string) => {
    setItems((actuales) => actuales.filter((i) => i.productoId !== productoId));
  }, []);

  /**
   * Vacía el carrito completo para un nuevo ticket de venta.
   */
  const limpiarCarrito = useCallback(() => {
    setItems([]);
  }, []);

  /**
   * Totales financieros calculados en tiempo real.
   */
  const totales = useMemo(() => {
    const subtotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);
    // IVA en el sistema actual es 0 (o calculado dentro del precio de venta)
    const iva = 0;
    const total = Math.round((subtotal + iva) * 100) / 100;
    const cantidadItems = items.reduce((acc, curr) => acc + curr.cantidad, 0);

    return {
      subtotal,
      iva,
      total,
      cantidadItems,
      tieneItems: items.length > 0,
    };
  }, [items]);

  return {
    items,
    totales,
    agregarProducto,
    actualizarCantidad,
    actualizarDescuento,
    eliminarItem,
    limpiarCarrito,
  };
}
