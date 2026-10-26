'use client';

/**
 * VendedorB2BPage — Terminal Comercial y Cotizador Multi-Bodega para Vendedores B2B.
 *
 * Cumple estrictamente con ARQUITECTURA.md:
 * - Feature-Sliced Design: Compuesto desde @/features/vendedor-b2b
 * - SOLID: Responsabilidad única, delegando estado a useVendedorB2B y useClientesB2B
 * - Menos de 150 líneas de código
 */

import React, { useState } from 'react';
import {
  VendedorB2BHeader,
  CatalogoMultiBodega,
  CotizacionPanel,
  NuevoClienteB2BModal,
  ComprobanteB2BModal,
  HistorialVentasB2BModal,
  useVendedorB2B,
  useClientesB2B,
} from '@/features/vendedor-b2b';

export default function VendedorB2BPage() {
  const [isHistorialOpen, setIsHistorialOpen] = useState(false);

  // Hook del cotizador y catálogo multi-bodega
  const {
    productos,
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
  } = useVendedorB2B();

  // Hook de directorio y creación de clientes corporativos con Zod
  const {
    clientes,
    isModalOpen: isModalClienteOpen,
    setIsModalOpen: setIsModalClienteOpen,
    isGuardando: isGuardandoCliente,
    formNuevoCliente,
    erroresForm: erroresCliente,
    errorGeneral: errorGeneralCliente,
    setCampo: setCampoCliente,
    registrarCliente,
  } = useClientesB2B();

  return (
    <div className="min-h-screen bg-[#0d1630] text-white flex flex-col font-[family-name:var(--font-archivo)] selection:bg-[#E9B949] selection:text-[#14213D]">
      {/* Header Corporativo B2B */}
      <VendedorB2BHeader onAbrirHistorial={() => setIsHistorialOpen(true)} />

      {/* Contenedor Principal: Catálogo a la izquierda + Panel de Cotización a la derecha */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
        <CatalogoMultiBodega
          productos={productos}
          categorias={categorias}
          filtros={filtros}
          setFiltros={setFiltros}
          isLoading={isLoadingCatalogo}
          copiadoSku={copiadoSku}
          onCopiarSku={copiarAlPortapapeles}
          onAgregarAlCarrito={agregarAlCarrito}
        />

        <CotizacionPanel
          items={itemsCotizacion}
          clienteSeleccionado={clienteSeleccionado}
          clientesDisponibles={clientes}
          onSeleccionarCliente={setClienteSeleccionado}
          onAbrirModalNuevoCliente={() => setIsModalClienteOpen(true)}
          medioPago={medioPago}
          setMedioPago={setMedioPago}
          referenciaPago={referenciaPago}
          setReferenciaPago={setReferenciaPago}
          subtotal={subtotal}
          iva={iva}
          total={total}
          onActualizarCantidad={actualizarCantidad}
          onRemoverItem={removerItem}
          onLimpiar={limpiarCotizacion}
          onEmitirFactura={emitirFacturaB2B}
          isSubmitting={isSubmitting}
          errorFactura={errorFactura}
        />
      </main>

      {/* Modales Desacoplados */}
      <NuevoClienteB2BModal
        isOpen={isModalClienteOpen}
        onClose={() => setIsModalClienteOpen(false)}
        form={formNuevoCliente}
        setCampo={setCampoCliente}
        errores={erroresCliente}
        errorGeneral={errorGeneralCliente}
        isGuardando={isGuardandoCliente}
        onGuardar={registrarCliente}
        onClienteCreado={(nuevo) => setClienteSeleccionado(nuevo)}
      />

      <ComprobanteB2BModal
        factura={facturaEmitida}
        onClose={() => setFacturaEmitida(null)}
      />

      <HistorialVentasB2BModal
        isOpen={isHistorialOpen}
        onClose={() => setIsHistorialOpen(false)}
      />
    </div>
  );
}
