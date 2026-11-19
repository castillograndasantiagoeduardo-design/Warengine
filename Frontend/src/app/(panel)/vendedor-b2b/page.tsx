'use client';

/**
 * VendedorB2BPage — Terminal Comercial B2B (Modo A):
 * El Vendedor B2B cotiza y envía a aval del Admin de Sucursal;
 * solo tras el aval factura y pasa a Pedido en Proceso.
 */

import React, { useEffect, useState } from 'react';
import {
  VendedorB2BLayout,
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
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export default function VendedorB2BPage() {
  const [isHistorialOpen, setIsHistorialOpen] = useState(false);
  const [isCotizacionesOpen, setIsCotizacionesOpen] = useState(false);
  const [creditoLiberadoMsg, setCreditoLiberadoMsg] = useState<string | null>(null);
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
    isLoadingClientes,
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
    recargarClientes,
  } = useClientesB2B();

  // Sincronizar el cliente seleccionado apenas el Super Admin apruebe o rechace su cupo
  useEffect(() => {
    if (!clienteSeleccionado) return;
    const actualizado = clientes.find((c) => c.id === clienteSeleccionado.id);
    if (!actualizado) return;

    const cambioCredito =
      actualizado.creditoHabilitado !== clienteSeleccionado.creditoHabilitado ||
      actualizado.estadoCredito !== clienteSeleccionado.estadoCredito ||
      actualizado.cupoCreditoAprobado !== clienteSeleccionado.cupoCreditoAprobado ||
      actualizado.cupoCreditoDisponible !== clienteSeleccionado.cupoCreditoDisponible ||
      actualizado.plazoCreditoDias !== clienteSeleccionado.plazoCreditoDias;

    if (cambioCredito) {
      const recienAprobado =
        !clienteSeleccionado.creditoHabilitado && actualizado.creditoHabilitado;
      setClienteSeleccionado(actualizado);
      if (recienAprobado) {
        setMedioPago('credito_corporativo');
        const cupoTxt = (
          actualizado.cupoCreditoDisponible ??
          actualizado.cupoCreditoAprobado ??
          0
        ).toLocaleString('es-CO');
        setCreditoLiberadoMsg(
          `¡Crédito liberado para ${actualizado.nombreRazonSocial}! Cupo disponible: $${cupoTxt} COP (${actualizado.plazoCreditoDias ?? 30} días). Ya puedes cotizar a crédito.`,
        );
      }
    }
  }, [clientes, clienteSeleccionado, setClienteSeleccionado, setMedioPago]);

  // Mientras el cliente seleccionado espera aprobación del Super Admin, consultar cada 8s en segundo plano
  useEffect(() => {
    if (clienteSeleccionado?.estadoCredito !== 'pendiente_aprobacion') return;
    const intervalo = setInterval(() => {
      void recargarClientes(undefined, true);
    }, 8000);
    return () => clearInterval(intervalo);
  }, [clienteSeleccionado?.id, clienteSeleccionado?.estadoCredito, recargarClientes]);

  return (
    <VendedorB2BLayout
      onAbrirHistorial={() => setIsHistorialOpen(true)}
      onAbrirCotizaciones={() => {
        void cargarCotizaciones();
        setIsCotizacionesOpen(true);
      }}
      cotizacionesAprobadasCount={cotizacionesAprobadasCount}
    >
      {/* Encabezado de la Vista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-titulos font-semibold tracking-[-0.005em] text-text">
            Terminal Comercial B2B
          </h1>
          <p className="text-sm font-sans font-medium text-text-muted mt-1">
            Cotización multi-bodega con verificación de cupo de crédito y solicitud de aval.
          </p>
        </div>
      </div>

      {/* Banners de Notificación / Alertas como Tarjetas en Vidrio */}
      {!isAuthLoading && sucursalId === null && (
        <div className="vidrio p-4 border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-xs font-sans font-medium">
            Tu usuario no tiene una sucursal asignada: no puedes cotizar hasta que un administrador te vincule a una sede.
          </p>
        </div>
      )}

      {alertaSuperAdminMsg && (
        <div className="vidrio p-4 border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs font-sans font-medium">{alertaSuperAdminMsg}</p>
          </div>
          <button
            type="button"
            onClick={() => setAlertaSuperAdminMsg(null)}
            className="p-1 rounded-lg text-amber-500 hover:text-amber-700 dark:hover:text-amber-100 hover:bg-amber-500/10 transition-colors cursor-pointer shrink-0"
            title="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {creditoLiberadoMsg && (
        <div className="vidrio p-4 border border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <p className="text-xs font-sans font-medium">{creditoLiberadoMsg}</p>
          </div>
          <button
            type="button"
            onClick={() => setCreditoLiberadoMsg(null)}
            className="p-1 rounded-lg text-green-500 hover:text-green-700 dark:hover:text-green-100 hover:bg-green-500/10 transition-colors cursor-pointer shrink-0"
            title="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {cotizacionEnviada && (
        <div className="vidrio p-4 border border-brand-500/30 bg-brand-500/10 text-brand-800 dark:text-brand-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-brand-500 shrink-0" />
            <p className="text-xs font-sans font-medium">
              Cotización <strong className="font-mono font-semibold">COT-{String(cotizacionEnviada.consecutivo).padStart(4, '0')}</strong> enviada al Administrador de Sucursal para su aval. Te aparecerá lista para facturar en &ldquo;Mis Cotizaciones&rdquo;.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCotizacionEnviada(null)}
            className="p-1 rounded-lg text-brand-500 hover:text-brand-700 dark:hover:text-brand-100 hover:bg-brand-500/10 transition-colors cursor-pointer shrink-0"
            title="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorCatalogo && (
        <div className="vidrio p-4 border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-xs font-sans font-medium">
            No se pudo cargar el catálogo: {errorCatalogo}
          </p>
        </div>
      )}

      {/* Contenido Principal: Catálogo Multi-Bodega + Panel de Cotización */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 w-full">
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
        </div>

        <div className="w-full lg:w-[400px] xl:w-[440px] shrink-0">
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
            onRefrescarClientes={() => void recargarClientes(undefined, false)}
            isRefreshingClientes={isLoadingClientes}
          />
        </div>
      </div>

      {/* Modales del Módulo */}
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
    </VendedorB2BLayout>
  );
}
