'use client';

/**
 * page.tsx — Terminal Punto de Venta (POS) para Cajeros de WarEngine.
 *
 * Implementación completa de punta a punta:
 * - Ciclo de vida de turnos de caja (apertura con fondo inicial, estado activo, arqueo y cierre con diferencia).
 * - Búsqueda ultra-rápida de productos por SKU / lector de código de barras o nombre.
 * - Carrito reactivo con control de cantidades, subtotales y cálculo financiero instantáneo.
 * - Gestión de clientes B2C / B2B con selección por defecto de Consumidor Final.
 * - Pasarela de cobro multi-medio (efectivo con calculadora de cambio, tarjeta, transferencia).
 * - Emisión transaccional de facturas validadas por triggers de base de datos.
 * - Comprobante térmico imprimible (80mm) con soporte para reimpresión desde historial.
 * - Alertas operativas prioritarias al Administrador de Sucursal.
 * - Atajos de teclado ergonómicos para cajeros (F2, F4, F8, F9, ESC).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/autenticacion';
import {
  usePosTurno,
  usePosVenta,
  usePosClientes,
  usePosCobro,
  PosHeader,
  PosTurnoModal,
  PosCatalogo,
  PosCarrito,
  PosCobroModal,
  PosTicketModal,
  PosClienteModal,
  PosAlertModal,
  PosHistorialDrawer,
  PosShortcutsBar,
  type FacturaDto,
  type ProductoPos,
} from '@/features/facturacion';

export default function PosTerminalPage() {
  const router = useRouter();
  const { usuario, logout, isLoading: isAuthLoading } = useAuth();

  // 1. Hooks de estado de la terminal
  const {
    turno,
    tieneTurnoAbierto,
    isLoading: isTurnoLoading,
    abrirTurno,
    cerrarTurno,
  } = usePosTurno();

  const {
    items,
    totales,
    agregarProducto,
    actualizarCantidad,
    eliminarItem,
    limpiarCarrito,
  } = usePosVenta();

  const {
    clienteSeleccionado,
    clientesEncontrados,
    terminoBusqueda,
    setTerminoBusqueda,
    isBuscando: isBuscandoCliente,
    isCreando: isCreandoCliente,
    seleccionarCliente,
    restablecerConsumidorFinal,
    crearClienteRapido,
  } = usePosClientes();

  const {
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
  } = usePosCobro();

  // 2. Estados de modales
  const [modalTurnoAbierto, setModalTurnoAbierto] = useState<boolean>(false);
  const [modalCobroAbierto, setModalCobroAbierto] = useState<boolean>(false);
  const [modalTicketAbierto, setModalTicketAbierto] = useState<boolean>(false);
  const [modalClienteAbierto, setModalClienteAbierto] = useState<boolean>(false);
  const [modalAlertaAbierto, setModalAlertaAbierto] = useState<boolean>(false);
  const [drawerHistorialAbierto, setDrawerHistorialAbierto] = useState<boolean>(false);
  const [facturaSeleccionadaTicket, setFacturaSeleccionadaTicket] = useState<FacturaDto | null>(null);

  // Referencia al input de búsqueda para el atajo F2
  const inputBuscarRef = useRef<HTMLInputElement | null>(null);

  // Apertura automática del modal de turno si no hay turno abierto al cargar
  useEffect(() => {
    if (!isTurnoLoading && !tieneTurnoAbierto) {
      setModalTurnoAbierto(true);
    }
  }, [isTurnoLoading, tieneTurnoAbierto]);

  // Manejo de atajos de teclado globales
  const handleKeyDownGlobal = useCallback(
    (e: KeyboardEvent) => {
      // F2: Foco en búsqueda de productos
      if (e.key === 'F2') {
        e.preventDefault();
        inputBuscarRef.current?.focus();
        inputBuscarRef.current?.select();
        return;
      }

      // F4: Cobrar orden
      if (e.key === 'F4') {
        e.preventDefault();
        if (totales.tieneItems && tieneTurnoAbierto && !modalCobroAbierto) {
          setModalCobroAbierto(true);
        }
        return;
      }

      // F8: Historial de comprobantes
      if (e.key === 'F8') {
        e.preventDefault();
        setDrawerHistorialAbierto((prev) => !prev);
        return;
      }

      // F9: Alerta al Administrador
      if (e.key === 'F9') {
        e.preventDefault();
        setModalAlertaAbierto((prev) => !prev);
        return;
      }

      // ESC: Cerrar modales abiertos
      if (e.key === 'Escape') {
        if (modalCobroAbierto) setModalCobroAbierto(false);
        if (modalTicketAbierto) setModalTicketAbierto(false);
        if (modalClienteAbierto) setModalClienteAbierto(false);
        if (modalAlertaAbierto) setModalAlertaAbierto(false);
        if (drawerHistorialAbierto) setDrawerHistorialAbierto(false);
        if (modalTurnoAbierto && tieneTurnoAbierto) setModalTurnoAbierto(false);
      }
    },
    [
      totales.tieneItems,
      tieneTurnoAbierto,
      modalCobroAbierto,
      modalTicketAbierto,
      modalClienteAbierto,
      modalAlertaAbierto,
      drawerHistorialAbierto,
      modalTurnoAbierto,
    ],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDownGlobal);
    return () => window.removeEventListener('keydown', handleKeyDownGlobal);
  }, [handleKeyDownGlobal]);

  // Manejador de confirmación del cobro
  const handleConfirmarCobro = async () => {
    try {
      const factura = await procesarCobro(items, totales.total, clienteSeleccionado);
      setFacturaSeleccionadaTicket(factura);
      setModalCobroAbierto(false);
      setModalTicketAbierto(true);
      limpiarCarrito();
      restablecerConsumidorFinal();
    } catch {
      // El hook captura y expone el mensaje de error
    }
  };

  // Manejador para reiniciar venta tras emitir ticket
  const handleNuevaVenta = () => {
    setModalTicketAbierto(false);
    setFacturaSeleccionadaTicket(null);
    reiniciarCobro();
    inputBuscarRef.current?.focus();
  };

  // Manejador para reimpresión de comprobante desde historial
  const handleSeleccionarParaReimprimir = (factura: FacturaDto) => {
    setFacturaSeleccionadaTicket(factura);
    setDrawerHistorialAbierto(false);
    setModalTicketAbierto(true);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/acceso');
  };

  if (isAuthLoading || isTurnoLoading) {
    return (
      <div className="min-h-screen bg-[#0d1630] flex flex-col items-center justify-center text-white gap-3 select-none">
        <div className="w-10 h-10 border-3 border-[#e3b341] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-[family-name:var(--font-pixelify)] text-sm text-[#e3b341] tracking-wider uppercase">
          Iniciando Terminal de Punto de Venta...
        </p>
      </div>
    );
  }

  const sucursalId = usuario?.sucursalId || 1;
  const sucursalNombre = usuario?.sucursalNombre || 'Sede Principal';

  return (
    <div className="h-screen flex flex-col bg-[#0d1630] text-white overflow-hidden">
      {/* 1. Barra Superior de Control */}
      <PosHeader
        usuarioNombre={usuario?.email?.split('@')[0] || 'Cajero'}
        usuarioEmail={usuario?.email || ''}
        sucursalNombre={sucursalNombre}
        turno={turno}
        onAbrirModalTurno={() => setModalTurnoAbierto(true)}
        onAbrirModalAlerta={() => setModalAlertaAbierto(true)}
        onAbrirHistorial={() => setDrawerHistorialAbierto(true)}
        onLogout={handleLogout}
      />

      {/* 2. Cuerpo Principal: Catálogo (Izquierda) + Carrito / Orden (Derecha) */}
      <main className="flex-1 flex overflow-hidden">
        {/* Catálogo de Productos y Búsqueda */}
        <PosCatalogo
          onAgregarProducto={(prod: ProductoPos) => {
            if (!tieneTurnoAbierto) {
              setModalTurnoAbierto(true);
              return;
            }
            agregarProducto(prod);
          }}
          inputBuscarRef={inputBuscarRef}
        />

        {/* Carrito de Venta y Cobro */}
        <PosCarrito
          items={items}
          totales={totales}
          cliente={clienteSeleccionado}
          tieneTurnoAbierto={tieneTurnoAbierto}
          onActualizarCantidad={actualizarCantidad}
          onEliminarItem={eliminarItem}
          onLimpiarCarrito={limpiarCarrito}
          onAbrirModalCliente={() => setModalClienteAbierto(true)}
          onIniciarCobro={() => {
            if (!tieneTurnoAbierto) {
              setModalTurnoAbierto(true);
              return;
            }
            setModalCobroAbierto(true);
          }}
        />
      </main>

      {/* 3. Barra Inferior de Atajos de Teclado */}
      <PosShortcutsBar />

      {/* ========================================================
          MODALES DE LA TERMINAL POS
         ======================================================== */}

      {/* Modal de Turno (Apertura o Cierre) */}
      <PosTurnoModal
        isOpen={modalTurnoAbierto}
        onClose={() => setModalTurnoAbierto(false)}
        turno={turno}
        onAbrirTurno={abrirTurno}
        onCerrarTurno={cerrarTurno}
      />

      {/* Modal de Cobro y Liquidación */}
      <PosCobroModal
        isOpen={modalCobroAbierto}
        onClose={() => setModalCobroAbierto(false)}
        totalVenta={totales.total}
        medioPago={medioPagoPrincipal}
        onCambiarMedioPago={setMedioPagoPrincipal}
        montoEfectivoRecibido={montoEfectivoRecibido}
        onCambiarMontoEfectivo={setMontoEfectivoRecibido}
        onAgregarDenominacion={agregarDenominacion}
        referenciaTarjeta={referenciaTarjeta}
        onCambiarReferenciaTarjeta={setReferenciaTarjeta}
        referenciaTransferencia={referenciaTransferencia}
        onCambiarReferenciaTransferencia={setReferenciaTransferencia}
        cambioDevuelta={calcularCambio(totales.total)}
        esPagoValido={esPagoValido(totales.total)}
        isEmitiendo={isEmitiendo}
        errorEmision={errorEmision}
        onConfirmarCobro={handleConfirmarCobro}
      />

      {/* Modal de Ticket / Comprobante Térmico */}
      <PosTicketModal
        isOpen={modalTicketAbierto}
        onClose={() => setModalTicketAbierto(false)}
        factura={facturaSeleccionadaTicket}
        cliente={clienteSeleccionado}
        sucursalNombre={sucursalNombre}
        cambioEntregado={calcularCambio(totales.total)}
        onNuevaVenta={handleNuevaVenta}
      />

      {/* Modal de Selección / Registro de Clientes */}
      <PosClienteModal
        isOpen={modalClienteAbierto}
        onClose={() => setModalClienteAbierto(false)}
        clienteActual={clienteSeleccionado}
        onSeleccionarCliente={seleccionarCliente}
        onCrearCliente={crearClienteRapido}
        onRestablecerConsumidorFinal={restablecerConsumidorFinal}
        clientesEncontrados={clientesEncontrados}
        terminoBusqueda={terminoBusqueda}
        onCambiarTerminoBusqueda={setTerminoBusqueda}
        isBuscando={isBuscandoCliente}
        isCreando={isCreandoCliente}
      />

      {/* Modal de Alerta Operativa al Administrador */}
      <PosAlertModal
        isOpen={modalAlertaAbierto}
        onClose={() => setModalAlertaAbierto(false)}
        sucursalId={sucursalId}
      />

      {/* Drawer Lateral de Historial de Facturas */}
      <PosHistorialDrawer
        isOpen={drawerHistorialAbierto}
        onClose={() => setDrawerHistorialAbierto(false)}
        sucursalId={sucursalId}
        onSeleccionarParaReimprimir={handleSeleccionarParaReimprimir}
      />
    </div>
  );
}
