'use client';

/**
 * VendedorB2BPage — Terminal Comercial B2B (Modo A):
 * El Vendedor B2B cotiza y envía a aval del Admin de Sucursal;
 * solo tras el aval factura y pasa a Pedido en Proceso.
 */

import React, { useState } from 'react';
import {
  VendedorB2BHeader,
  CatalogoMultiBodega,
  CotizacionPanel,
  NuevoClienteB2BModal,
  ComprobanteB2BModal,
  HistorialVentasB2BModal,
  MisCotizacionesB2BModal,
  useVendedorB2B,
  useClientesB2B,
} from '@/features/vendedor-b2b';
import { useAuth } from '@/features/autenticacion';

export default function VendedorB2BPage() {
  const [isHistorialOpen, setIsHistorialOpen] = useState(false);
  const [isCotizacionesOpen, setIsCotizacionesOpen] = useState(false);
  const { usuario, isLoading: isAuthLoading } = useAuth();
  const sucursalId = usuario?.sucursalId ?? null;

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
    errorCatalogo,
  } = useVendedorB2B(sucursalId);

  const {
    clientes,
    isModalOpen: isModalClienteOpen,
    setIsModalOpen: setIsModalClienteOpen,
    isGuardando: isGuardandoCliente,
    formNuevoCliente,
    erroresForm: erroresCliente,
    errorGeneral: errorGeneralCliente,
    evaluacionCredito,
    isSimulandoCredito,
    alertaSuperAdminMsg,
    setAlertaSuperAdminMsg,
    setCampo: setCampoCliente,
    registrarCliente,
  } = useClientesB2B();

  return (
    <div className="min-h-screen bg-[#0d1630] text-white flex flex-col font-[family-name:var(--font-archivo)] selection:bg-[#E9B949] selection:text-[#14213D]">
      <VendedorB2BHeader
        onAbrirHistorial={() => setIsHistorialOpen(true)}
        onAbrirCotizaciones={() => {
          void cargarCotizaciones();
          setIsCotizacionesOpen(true);
        }}
        cotizacionesAprobadasCount={cotizacionesAprobadasCount}
      />

      {!isAuthLoading && sucursalId === null && (
        <div className="max-w-7xl w-full mx-auto mt-4 px-4 sm:px-6">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm">
            Tu usuario no tiene una sucursal asignada: no puedes cotizar hasta que un administrador te vincule a una sede.
          </div>
        </div>
      )}

      {alertaSuperAdminMsg && (
        <div className="max-w-7xl w-full mx-auto mt-4 px-4 sm:px-6">
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3">
            <span>{alertaSuperAdminMsg}</span>
            <button
              type="button"
              onClick={() => setAlertaSuperAdminMsg(null)}
              className="text-amber-300 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {cotizacionEnviada && (
        <div className="max-w-7xl w-full mx-auto mt-4 px-4 sm:px-6">
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-3">
            <span>
              Cotización <strong>COT-{String(cotizacionEnviada.consecutivo).padStart(4, '0')}</strong> enviada al Administrador de Sucursal para su aval. Te aparecerá lista para facturar en &ldquo;Mis Cotizaciones&rdquo;.
            </span>
            <button
              type="button"
              onClick={() => setCotizacionEnviada(null)}
              className="text-emerald-300 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {errorCatalogo && (
        <div className="max-w-7xl w-full mx-auto mt-4 px-4 sm:px-6">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm">
            No se pudo cargar el catálogo: {errorCatalogo}
          </div>
        </div>
      )}

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
          observaciones={observaciones}
          setObservaciones={setObservaciones}
          subtotal={subtotal}
          iva={iva}
          total={total}
          onActualizarCantidad={actualizarCantidad}
          onRemoverItem={removerItem}
          onLimpiar={limpiarCotizacion}
          onEnviarCotizacion={enviarCotizacionAAval}
          isSubmitting={isSubmitting}
          errorFactura={errorFactura}
        />
      </main>

      <NuevoClienteB2BModal
        isOpen={isModalClienteOpen}
        onClose={() => setIsModalClienteOpen(false)}
        form={formNuevoCliente}
        setCampo={setCampoCliente}
        errores={erroresCliente}
        errorGeneral={errorGeneralCliente}
        evaluacionCredito={evaluacionCredito}
        isSimulandoCredito={isSimulandoCredito}
        isGuardando={isGuardandoCliente}
        onGuardar={registrarCliente}
        onClienteCreado={(nuevo) => setClienteSeleccionado(nuevo)}
      />

      <MisCotizacionesB2BModal
        isOpen={isCotizacionesOpen}
        onClose={() => setIsCotizacionesOpen(false)}
        cotizaciones={cotizaciones}
        isLoading={isLoadingCotizaciones}
        facturandoId={facturandoId}
        onRecargar={() => void cargarCotizaciones()}
        onFacturar={facturarCotizacionAprobada}
      />

      <ComprobanteB2BModal factura={facturaEmitida} onClose={() => setFacturaEmitida(null)} />

      <HistorialVentasB2BModal isOpen={isHistorialOpen} onClose={() => setIsHistorialOpen(false)} />
    </div>
  );
}
