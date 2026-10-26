'use client';

/**
 * useVendedorB2B.ts — Custom hook para la lógica del panel Vendedor B2B.
 *
 * Principio SRP: Separa completamente el cálculo matemático, gestión de catálogo
 * y despacho de facturación B2B de los componentes visuales de UI.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { vendedorB2bService } from '../api';
import type {
  ProductoResponse,
  ItemCotizacionB2B,
  FiltrosCatalogoB2B,
  FacturaDto,
  MedioPago,
  ClienteDto,
} from '../types';
import { ApiError } from '@/lib/api';

const IVA_PORCENTAJE = 0.19;

export function useVendedorB2B() {
  const [productos, setProductos] = useState<ProductoResponse[]>([]);
  const [categorias, setCategorias] = useState<Array<{ id: number; nombre: string }>>([]);
  const [isLoadingCatalogo, setIsLoadingCatalogo] = useState<boolean>(true);
  const [filtros, setFiltros] = useState<FiltrosCatalogoB2B>({
    texto: '',
    categoriaId: null,
    disponibilidad: 'todos',
  });

  const [itemsCotizacion, setItemsCotizacion] = useState<ItemCotizacionB2B[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteDto | null>(null);
  const [medioPago, setMedioPago] = useState<MedioPago>('credito_corporativo');
  const [referenciaPago, setReferenciaPago] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorFactura, setErrorFactura] = useState<string | null>(null);
  const [facturaEmitida, setFacturaEmitida] = useState<FacturaDto | null>(null);
  const [copiadoSku, setCopiadoSku] = useState<string | null>(null);

  // Cargar catálogo inicial y categorías
  const cargarCatalogo = useCallback(async () => {
    setIsLoadingCatalogo(true);
    try {
      const [prods, cats] = await Promise.all([
        vendedorB2bService.obtenerProductos(),
        vendedorB2bService.obtenerCategorias(),
      ]);
      setProductos(prods);
      setCategorias(cats);
    } catch {
      // Fallback a catálogo vacío sin romper la interfaz
      setProductos([]);
    } finally {
      setIsLoadingCatalogo(false);
    }
  }, []);

  useEffect(() => {
    cargarCatalogo();
  }, [cargarCatalogo]);

  // Filtrado reactivo en memoria para búsqueda fluida y filtros combinados (RF-FMC-D13)
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      if (filtros.texto) {
        const busqueda = filtros.texto.toLowerCase();
        const coincideNombre = p.nombre.toLowerCase().includes(busqueda);
        const coincideSku = p.sku.toLowerCase().includes(busqueda);
        if (!coincideNombre && !coincideSku) return false;
      }
      if (filtros.categoriaId && p.categoriaId !== filtros.categoriaId) {
        return false;
      }
      return true;
    });
  }, [productos, filtros]);

  // Copiar SKU o referencia al portapapeles (RF-FMC-C7)
  const copiarAlPortapapeles = useCallback((sku: string) => {
    navigator.clipboard.writeText(sku).then(() => {
      setCopiadoSku(sku);
      setTimeout(() => setCopiadoSku(null), 2000);
    });
  }, []);

  // Agregar producto a la cotización B2B (aplica precio corporativo prioritario RF-FMC-C6)
  const agregarAlCarrito = useCallback((producto: ProductoResponse) => {
    setItemsCotizacion((prev) => {
      const existente = prev.find((i) => i.productoId === producto.id);
      const precioUnitario = producto.precioCorporativo && producto.precioCorporativo > 0
        ? producto.precioCorporativo
        : producto.precioVenta;

      if (existente) {
        return prev.map((item) =>
          item.productoId === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precioUnitario - item.descuento,
              }
            : item,
        );
      }

      return [
        ...prev,
        {
          productoId: producto.id,
          sku: producto.sku,
          nombre: producto.nombre,
          precioUnitario,
          precioVentaOriginal: producto.precioVenta,
          esPrecioCorporativo: Boolean(producto.precioCorporativo && producto.precioCorporativo > 0),
          cantidad: 1,
          descuento: 0,
          subtotal: precioUnitario,
        },
      ];
    });
  }, []);

  const actualizarCantidad = useCallback((productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      setItemsCotizacion((prev) => prev.filter((i) => i.productoId !== productoId));
      return;
    }
    setItemsCotizacion((prev) =>
      prev.map((item) =>
        item.productoId === productoId
          ? {
              ...item,
              cantidad,
              subtotal: cantidad * item.precioUnitario - item.descuento,
            }
          : item,
      ),
    );
  }, []);

  const removerItem = useCallback((productoId: string) => {
    setItemsCotizacion((prev) => prev.filter((i) => i.productoId !== productoId));
  }, []);

  const limpiarCotizacion = useCallback(() => {
    setItemsCotizacion([]);
    setClienteSeleccionado(null);
    setReferenciaPago('');
    setErrorFactura(null);
  }, []);

  // Cálculos consolidados
  const { subtotal, iva, total } = useMemo(() => {
    const rawSubtotal = itemsCotizacion.reduce((acc, item) => acc + item.subtotal, 0);
    const ivaCalculado = Math.round(rawSubtotal * IVA_PORCENTAJE);
    const totalCalculado = rawSubtotal + ivaCalculado;
    return {
      subtotal: rawSubtotal,
      iva: ivaCalculado,
      total: totalCalculado,
    };
  }, [itemsCotizacion]);

  // Emisión de orden B2B (RF-FMC-A6, B13)
  const emitirFacturaB2B = useCallback(async (): Promise<boolean> => {
    if (!clienteSeleccionado) {
      setErrorFactura('Debes seleccionar o registrar un cliente corporativo.');
      return false;
    }
    if (itemsCotizacion.length === 0) {
      setErrorFactura('Agrega al menos un producto a la cotización.');
      return false;
    }

    if (medioPago === 'credito_corporativo' && !clienteSeleccionado.creditoHabilitado) {
      setErrorFactura('El cliente no cuenta con cupo de crédito corporativo autorizado.');
      return false;
    }

    setIsSubmitting(true);
    setErrorFactura(null);

    try {
      const resultado = await vendedorB2bService.crearFacturaB2B({
        clienteId: clienteSeleccionado.id,
        items: itemsCotizacion.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          descuento: i.descuento,
        })),
        pagos: [
          {
            medioPago,
            monto: total,
            referenciaTransaccion: referenciaPago.trim() || null,
          },
        ],
        esB2B: true,
      });

      setFacturaEmitida(resultado);
      limpiarCotizacion();
      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorFactura(err.message || 'No se pudo emitir la factura B2B.');
      } else {
        setErrorFactura('Error de comunicación con el backend.');
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [clienteSeleccionado, itemsCotizacion, medioPago, total, referenciaPago, limpiarCotizacion]);

  return {
    productos: productosFiltrados,
    totalOriginal: productos.length,
    categorias,
    isLoadingCatalogo,
    filtros,
    setFiltros,
    itemsCotizacion,
    clienteSeleccionado,
    setClienteSeleccionado,
    medioPago,
    setMedioPago,
    referenciaPago,
    setReferenciaPago,
    subtotal,
    iva,
    total,
    isSubmitting,
    errorFactura,
    facturaEmitida,
    setFacturaEmitida,
    copiadoSku,
    copiarAlPortapapeles,
    agregarAlCarrito,
    actualizarCantidad,
    removerItem,
    limpiarCotizacion,
    emitirFacturaB2B,
    recargarCatalogo: cargarCatalogo,
  };
}
