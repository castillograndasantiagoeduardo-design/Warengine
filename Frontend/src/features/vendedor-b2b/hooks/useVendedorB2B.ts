'use client';

/**
 * useVendedorB2B.ts — Custom hook para el flujo comercial B2B (Modo A):
 * El Vendedor B2B arma y envía cotizaciones a aval del Admin de Sucursal;
 * solo cuando la cotización recibe el aval (`aprobada`), puede facturarla y pasarla a Pedido en Proceso.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { vendedorB2bService } from '../api';
import type {
  ProductoCatalogoB2B,
  ItemCotizacionB2B,
  FiltrosCatalogoB2B,
  CotizacionB2BDto,
  FacturaDto,
  MedioPago,
  ClienteDto,
} from '../types';
import { ApiError } from '@/lib/api';

export function useVendedorB2B(sucursalId: number | null) {
  const [productos, setProductos] = useState<ProductoCatalogoB2B[]>([]);
  const [errorCatalogo, setErrorCatalogo] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Array<{ id: number; nombre: string }>>([]);
  const [isLoadingCatalogo, setIsLoadingCatalogo] = useState<boolean>(true);
  const [filtros, setFiltros] = useState<FiltrosCatalogoB2B>({
    texto: '',
    categoriaId: null,
    disponibilidad: 'todos',
  });

  const [itemsCotizacion, setItemsCotizacion] = useState<ItemCotizacionB2B[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteDto | null>(null);
  const [medioPago, setMedioPago] = useState<MedioPago>('transferencia');
  const [referenciaPago, setReferenciaPago] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorFactura, setErrorFactura] = useState<string | null>(null);
  const [cotizacionEnviada, setCotizacionEnviada] = useState<CotizacionB2BDto | null>(null);
  const [facturaEmitida, setFacturaEmitida] = useState<FacturaDto | null>(null);
  const [copiadoSku, setCopiadoSku] = useState<string | null>(null);

  const [cotizaciones, setCotizaciones] = useState<CotizacionB2BDto[]>([]);
  const [isLoadingCotizaciones, setIsLoadingCotizaciones] = useState<boolean>(false);
  const [facturandoId, setFacturandoId] = useState<string | null>(null);

  const cargarCatalogo = useCallback(async () => {
    if (sucursalId === null) {
      setIsLoadingCatalogo(false);
      return;
    }
    setIsLoadingCatalogo(true);
    setErrorCatalogo(null);
    try {
      const [prods, cats] = await Promise.all([
        vendedorB2bService.obtenerProductos(sucursalId),
        vendedorB2bService.obtenerCategorias(),
      ]);
      setProductos(prods);
      setCategorias(cats);
    } catch (err) {
      setProductos([]);
      setErrorCatalogo(err instanceof Error ? err.message : 'No se pudo cargar el catálogo.');
    } finally {
      setIsLoadingCatalogo(false);
    }
  }, [sucursalId]);

  const cargarCotizaciones = useCallback(async () => {
    setIsLoadingCotizaciones(true);
    try {
      const lista = await vendedorB2bService.listarCotizacionesB2B();
      setCotizaciones(lista);
    } finally {
      setIsLoadingCotizaciones(false);
    }
  }, []);

  useEffect(() => {
    if (clienteSeleccionado && !clienteSeleccionado.creditoHabilitado && medioPago === 'credito_corporativo') {
      setMedioPago('transferencia');
    }
  }, [clienteSeleccionado, medioPago]);

  useEffect(() => {
    cargarCatalogo();
    cargarCotizaciones();
  }, [cargarCatalogo, cargarCotizaciones]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      if (filtros.texto) {
        const busqueda = filtros.texto.toLowerCase();
        if (!p.nombre.toLowerCase().includes(busqueda) && !p.sku.toLowerCase().includes(busqueda)) {
          return false;
        }
      }
      if (filtros.categoriaId && p.categoriaId !== filtros.categoriaId) {
        return false;
      }
      return true;
    });
  }, [productos, filtros]);

  const copiarAlPortapapeles = useCallback((sku: string) => {
    navigator.clipboard.writeText(sku).then(() => {
      setCopiadoSku(sku);
      setTimeout(() => setCopiadoSku(null), 2000);
    });
  }, []);

  const agregarAlCarrito = useCallback((producto: ProductoCatalogoB2B) => {
    if (producto.stockSede <= 0) return;
    setItemsCotizacion((prev) => {
      const existente = prev.find((i) => i.productoId === producto.id);
      if (existente && existente.cantidad >= producto.stockSede) return prev;
      const precioUnitario =
        producto.precioCorporativo && producto.precioCorporativo > 0
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
          stockDisponible: producto.stockSede,
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
              cantidad: Math.min(cantidad, item.stockDisponible ?? cantidad),
              subtotal:
                Math.min(cantidad, item.stockDisponible ?? cantidad) * item.precioUnitario - item.descuento,
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
    setObservaciones('');
    setErrorFactura(null);
  }, []);

  const { subtotal, iva, total } = useMemo(() => {
    const rawSubtotal =
      Math.round(
        itemsCotizacion.reduce((acc, item) => acc + Math.round(item.subtotal * 100) / 100, 0) * 100,
      ) / 100;
    return { subtotal: rawSubtotal, iva: 0, total: rawSubtotal };
  }, [itemsCotizacion]);

  // Paso 1 (Modo A): Vendedor B2B crea y envía la cotización a aval del Admin de Sucursal
  const enviarCotizacionAAval = useCallback(async (): Promise<boolean> => {
    if (!clienteSeleccionado) {
      setErrorFactura('Debes seleccionar o registrar un cliente corporativo.');
      return false;
    }
    if (itemsCotizacion.length === 0) {
      setErrorFactura('Agrega al menos un producto a la cotización.');
      return false;
    }

    setIsSubmitting(true);
    setErrorFactura(null);

    try {
      const creada = await vendedorB2bService.crearCotizacionB2B({
        clienteId: clienteSeleccionado.id,
        medioPagoSugerido: medioPago,
        referenciaPago: referenciaPago.trim() || null,
        diasVigencia: 7,
        observaciones: observaciones.trim() || null,
        items: itemsCotizacion.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          descuento: i.descuento,
        })),
      });

      setCotizacionEnviada(creada);
      limpiarCotizacion();
      void cargarCotizaciones();
      return true;
    } catch (err) {
      setErrorFactura(
        err instanceof ApiError
          ? err.message || 'No se pudo enviar la cotización a aval.'
          : 'Error de comunicación con el backend.',
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    clienteSeleccionado,
    itemsCotizacion,
    medioPago,
    referenciaPago,
    observaciones,
    limpiarCotizacion,
    cargarCotizaciones,
  ]);

  // Paso 2 (Modo A): Solo cuando la cotización fue avalada (`aprobada`), se factura y pasa a pedido en proceso
  const facturarCotizacionAprobada = useCallback(
    async (cotizacionId: string): Promise<{ ok: boolean; error?: string }> => {
      setFacturandoId(cotizacionId);
      try {
        const res = await vendedorB2bService.facturarCotizacionB2B(cotizacionId);
        setFacturaEmitida(res.factura);
        void cargarCotizaciones();
        void cargarCatalogo();
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof ApiError
              ? err.message
              : 'No se pudo facturar la cotización aprobada.',
        };
      } finally {
        setFacturandoId(null);
      }
    },
    [cargarCotizaciones, cargarCatalogo],
  );

  const cotizacionesAprobadasCount = useMemo(
    () => cotizaciones.filter((c) => c.estado === 'aprobada').length,
    [cotizaciones],
  );

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
    observaciones,
    setObservaciones,
    subtotal,
    iva,
    total,
    isSubmitting,
    errorFactura,
    cotizacionEnviada,
    setCotizacionEnviada,
    facturaEmitida,
    setFacturaEmitida,
    cotizaciones,
    cotizacionesAprobadasCount,
    isLoadingCotizaciones,
    facturandoId,
    cargarCotizaciones,
    copiadoSku,
    copiarAlPortapapeles,
    agregarAlCarrito,
    actualizarCantidad,
    removerItem,
    limpiarCotizacion,
    enviarCotizacionAAval,
    facturarCotizacionAprobada,
    recargarCatalogo: cargarCatalogo,
    errorCatalogo,
  };
}
