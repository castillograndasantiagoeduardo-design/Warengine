'use client';

/**
 * usePosCobro.ts — Hook para el flujo de cobro, medios de pago y emisión de facturas.
 *
 * Principio SOLID:
 * - Single Responsibility: Controla la liquidación monetaria, validación de pago exacto
 *   y la invocación transaccional al endpoint de facturación.
 */

import { useState, useMemo, useCallback } from 'react';
import { posService } from '../api';
import type {
  FacturaDto,
  ItemCarritoPos,
  ClienteDto,
  MedioPago,
  PagoFacturaInput,
} from '../types/pos.types';

export function usePosCobro() {
  const [medioPagoPrincipal, setMedioPagoPrincipal] = useState<MedioPago>('efectivo');
  const [montoEfectivoRecibido, setMontoEfectivoRecibido] = useState<number>(0);
  const [referenciaTarjeta, setReferenciaTarjeta] = useState<string>('');
  const [referenciaTransferencia, setReferenciaTransferencia] = useState<string>('');
  const [isEmitiendo, setIsEmitiendo] = useState<boolean>(false);
  const [errorEmision, setErrorEmision] = useState<string | null>(null);
  const [facturaEmitida, setFacturaEmitida] = useState<FacturaDto | null>(null);

  /**
   * Cálculo de cambio / devuelta según el total y el medio seleccionado
   */
  const calcularCambio = useCallback(
    (totalVenta: number): number => {
      if (medioPagoPrincipal !== 'efectivo') return 0;
      if (montoEfectivoRecibido <= totalVenta) return 0;
      return Math.round((montoEfectivoRecibido - totalVenta) * 100) / 100;
    },
    [medioPagoPrincipal, montoEfectivoRecibido],
  );

  /**
   * Indica si la liquidación es válida para emitir factura
   */
  const esPagoValido = useCallback(
    (totalVenta: number): boolean => {
      if (totalVenta <= 0) return false;
      if (medioPagoPrincipal === 'efectivo') {
        return montoEfectivoRecibido >= totalVenta;
      }
      return true;
    },
    [medioPagoPrincipal, montoEfectivoRecibido],
  );

  /**
   * Selección rápida de denominación de billetes
   */
  const establecerMontoEfectivo = useCallback((monto: number) => {
    setMontoEfectivoRecibido(monto);
  }, []);

  const agregarDenominacion = useCallback((denominacion: number) => {
    setMontoEfectivoRecibido((actual) => actual + denominacion);
  }, []);

  /**
   * Procesa la emisión de la factura hacia el backend
   */
  const procesarCobro = async (
    items: ItemCarritoPos[],
    totalVenta: number,
    cliente: ClienteDto,
  ): Promise<FacturaDto> => {
    if (items.length === 0) {
      throw new Error('El carrito no contiene productos.');
    }
    if (!esPagoValido(totalVenta)) {
      throw new Error('El monto recibido es insuficiente para cubrir el total de la venta.');
    }

    setIsEmitiendo(true);
    setErrorEmision(null);

    try {
      // Si el cliente seleccionado es el consumidor final local provisional, asegurar ID válido
      let clienteId = cliente.id;
      if (clienteId === 'CONSUMIDOR_FINAL') {
        const clienteRegistrado = await posService.crearCliente({
          tipoDocumento: 'CC',
          numeroDocumento: '222222222222',
          nombreRazonSocial: 'Consumidor Final',
          tipoCliente: 'B2C',
        });
        clienteId = clienteRegistrado.cliente.id;
      }

      // Estructura de pagos: la API exige que la suma de pagos sea exactamente igual al total
      const pagos: PagoFacturaInput[] = [];

      if (medioPagoPrincipal === 'efectivo') {
        pagos.push({
          medioPago: 'efectivo',
          monto: totalVenta,
        });
      } else if (medioPagoPrincipal === 'tarjeta') {
        pagos.push({
          medioPago: 'tarjeta',
          monto: totalVenta,
          referenciaTransaccion: referenciaTarjeta.trim() || undefined,
        });
      } else if (medioPagoPrincipal === 'transferencia') {
        pagos.push({
          medioPago: 'transferencia',
          monto: totalVenta,
          referenciaTransaccion: referenciaTransferencia.trim() || undefined,
        });
      }

      const inputItems = items.map((i) => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
        descuento: i.descuento || 0,
      }));

      const factura = await posService.emitirFactura({
        clienteId,
        items: inputItems,
        pagos,
        esB2B: cliente.tipoCliente === 'B2B',
      });

      setFacturaEmitida(factura);
      return factura;
    } catch (err: any) {
      const msg = err?.message || 'Error al emitir la factura.';
      setErrorEmision(msg);
      throw err;
    } finally {
      setIsEmitiendo(false);
    }
  };

  /**
   * Resetea el formulario de cobro para una nueva venta
   */
  const reiniciarCobro = useCallback(() => {
    setMedioPagoPrincipal('efectivo');
    setMontoEfectivoRecibido(0);
    setReferenciaTarjeta('');
    setReferenciaTransferencia('');
    setErrorEmision(null);
    setFacturaEmitida(null);
  }, []);

  return {
    medioPagoPrincipal,
    setMedioPagoPrincipal,
    montoEfectivoRecibido,
    setMontoEfectivoRecibido,
    referenciaTarjeta,
    setReferenciaTarjeta,
    referenciaTransferencia,
    setReferenciaTransferencia,
    isEmitiendo,
    errorEmision,
    facturaEmitida,
    calcularCambio,
    esPagoValido,
    establecerMontoEfectivo,
    agregarDenominacion,
    procesarCobro,
    reiniciarCobro,
  };
}
