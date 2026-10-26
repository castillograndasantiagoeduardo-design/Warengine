'use client';

/**
 * BranchInvoicingView.tsx — Vista principal de supervisión de facturación y alertas de mostrador.
 * 
 * Principios SOLID:
 * - Single Responsibility Principle (SRP): Orquesta la auditoría de ventas, anulación de facturas
 *   con restitución atómica de existencias (RF-FMC-E10) y el centro de resolución de alertas (RF-FMC-F1..F8).
 * - Dependency Inversion Principle (DIP): Se alimenta del hook useBranchInvoicing.
 */

import React, { useState } from 'react';
import { useBranchInvoicing } from '../hooks/useBranchInvoicing';
import { GlassCard } from './GlassCard';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { VoidInvoiceModal } from './VoidInvoiceModal';
import {
  ReceiptTextIcon,
  DollarSignIcon,
  SearchIcon,
  RefreshCwIcon,
  ShieldIcon,
  UsersRoundIcon,
} from './Icons';
import type { FacturaSede, AlertaOperativa } from '../types/branch-invoicing.types';

interface BranchInvoicingViewProps {
  sucursalId: number;
  sucursalNombre?: string;
  className?: string;
}

export function BranchInvoicingView({
  sucursalId,
  sucursalNombre,
  className = '',
}: BranchInvoicingViewProps) {
  const {
    facturas,
    alertas,
    kpis,
    tabActiva,
    setTabActiva,
    busqueda,
    setBusqueda,
    filtroEstado,
    setFiltroEstado,
    filtroPrioridadAlerta,
    setFiltroPrioridadAlerta,
    filtroEstadoAlerta,
    setFiltroEstadoAlerta,
    isLoading,
    isMutating,
    error,
    recargar,
    anularFactura,
    marcarAlerta,
  } = useBranchInvoicing({ sucursalId });

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaSede | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);

  const handleVerDetalle = (fac: FacturaSede) => {
    setFacturaSeleccionada(fac);
    setIsDetailModalOpen(true);
  };

  const handleAbrirAnular = (fac: FacturaSede) => {
    setFacturaSeleccionada(fac);
    setIsDetailModalOpen(false);
    setIsVoidModalOpen(true);
  };

  return (
    <div className={`space-y-5 animate-in fade-in duration-300 ${className}`}>
      
      {/* 1. Encabezado de Supervisión de Ventas */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/[0.04]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-[family-name:var(--font-anton)] tracking-wider text-white uppercase">
              Supervisión de Facturación & Alertas
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-[#e3b341]/10 text-[#e3b341] border border-[#e3b341]/25 font-[family-name:var(--font-ui)]">
              {sucursalNombre}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-[family-name:var(--font-archivo)] mt-0.5">
            Trazabilidad de comprobantes de mostrador, anulación con reversión de inventario y resolución de incidencias.
          </p>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => recargar()}
            title="Refrescar operaciones"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <RefreshCwIcon size={15} className={isLoading ? 'animate-spin text-[#e3b341]' : ''} />
          </button>
        </div>
      </div>

      {/* Banner de Error si ocurre */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => recargar()}
            className="text-xs underline text-red-200 hover:text-white font-semibold cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* 2. Tarjetas KPI de Telemetría Fiscal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Ventas Netas */}
        <div className="p-4 rounded-2xl bg-[#09132b]/80 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Ventas Netas Sede</span>
            <p className="text-lg font-bold font-mono text-white mt-0.5">
              {formatCOP(kpis.totalVentas)}
            </p>
            <span className="text-[10px] text-[#10b981] font-semibold">Comprobantes válidos</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
            <DollarSignIcon size={18} />
          </div>
        </div>

        {/* KPI 2: Facturas Emitidas */}
        <div className="p-4 rounded-2xl bg-[#09132b]/80 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Facturas Emitidas</span>
            <p className="text-lg font-bold font-mono text-white mt-0.5">
              {kpis.totalEmitidas}
            </p>
            <span className="text-[10px] text-slate-400">Total en firme</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e3b341]/15 text-[#e3b341] border border-[#e3b341]/30">
            <ReceiptTextIcon size={18} />
          </div>
        </div>

        {/* KPI 3: Facturas Anuladas */}
        <div className="p-4 rounded-2xl bg-[#09132b]/80 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Facturas Anuladas</span>
            <p className="text-lg font-bold font-mono text-red-400 mt-0.5">
              {kpis.totalAnuladas}
            </p>
            <span className="text-[10px] text-slate-400">Stock revertido</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-400 border border-red-500/30">
            <ShieldIcon size={18} />
          </div>
        </div>

        {/* KPI 4: Alertas de Mostrador */}
        <div className="p-4 rounded-2xl bg-[#09132b]/80 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Alertas Cajeros</span>
            <p className="text-lg font-bold font-mono text-amber-400 mt-0.5">
              {kpis.totalAlertasPendientes}
            </p>
            <span className="text-[10px] text-amber-400/90 font-semibold">
              {kpis.totalAlertasUrgentes} urgentes
            </span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <UsersRoundIcon size={18} />
          </div>
        </div>

      </div>

      {/* 3. Selector de Pestañas: Facturas vs Alertas */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
        <button
          onClick={() => setTabActiva('facturas')}
          className={`
            px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-[family-name:var(--font-archivo)]
            ${
              tabActiva === 'facturas'
                ? 'bg-[#e3b341]/15 text-[#e3b341] border border-[#e3b341]/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }
          `}
        >
          🧾 Comprobantes de Venta ({facturas.length})
        </button>

        <button
          onClick={() => setTabActiva('alertas')}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-[family-name:var(--font-archivo)]
            ${
              tabActiva === 'alertas'
                ? 'bg-[#e3b341]/15 text-[#e3b341] border border-[#e3b341]/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }
          `}
        >
          <span>🔔 Centro de Alertas ({alertas.length})</span>
          {kpis.totalAlertasPendientes > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-mono font-bold animate-pulse">
              {kpis.totalAlertasPendientes}
            </span>
          )}
        </button>
      </div>

      {/* 4. Contenido de la Pestaña Activa */}
      {tabActiva === 'facturas' ? (
        
        /* ── SECCIÓN A: TABLA DE FACTURAS ── */
        <GlassCard padding="lg" className="space-y-4">
          
          {/* Barra de Filtros de Facturas */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Buscador Reactivo */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon size={14} />
              </span>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por # folio, cliente, documento o cajero..."
                className="w-full h-9 pl-9 pr-3 text-xs text-white placeholder-slate-400 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:border-[#e3b341]/60 focus:ring-1 focus:ring-[#e3b341]/40"
              />
            </div>

            {/* Píldoras de Estado */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
              {(['todas', 'emitida', 'anulada'] as const).map((est) => (
                <button
                  key={est}
                  onClick={() => setFiltroEstado(est)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer
                    ${
                      filtroEstado === est
                        ? 'bg-[#e3b341] text-[#0d1630] shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }
                  `}
                >
                  {est === 'todas' ? 'Todas' : est === 'emitida' ? 'Emitidas' : 'Anuladas'}
                </button>
              ))}
            </div>

          </div>

          {/* Tabla de Facturas */}
          {facturas.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-slate-400">
                <ReceiptTextIcon size={22} />
              </div>
              <p className="text-xs font-bold text-slate-200 uppercase">Sin comprobantes registrados</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                No se han registrado facturas emitidas en esta sede todavía. Las ventas generadas en el Punto de Venta (POS) aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-slate-400 text-[10px] uppercase font-mono">
                    <th className="py-3 px-3">Folio</th>
                    <th className="py-3 px-3">Fecha</th>
                    <th className="py-3 px-3">Cliente</th>
                    <th className="py-3 px-3">Cajero / Operador</th>
                    <th className="py-3 px-3">Medio de Pago</th>
                    <th className="py-3 px-3 text-right">Total (COP)</th>
                    <th className="py-3 px-3 text-center">Estado</th>
                    <th className="py-3 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {facturas.map((fac) => {
                    const isAnulada = fac.estado === 'anulada';
                    const primerMedio = fac.pagos[0]?.medioPago || 'efectivo';

                    return (
                      <tr key={fac.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-white">
                          {fac.folioFormateado}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {fac.fechaFormateada}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-white block">{fac.clienteNombre}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Doc: {fac.clienteDocumento}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {fac.cajeroNombre}
                        </td>
                        <td className="py-3 px-3">
                          <span className="capitalize px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] text-slate-300">
                            {primerMedio.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#e3b341]">
                          {fac.totalFormateado}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`
                              px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border
                              ${
                                isAnulada
                                  ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                  : 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                              }
                            `}
                          >
                            {isAnulada ? 'Anulada' : 'Emitida'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleVerDetalle(fac)}
                              className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
                            >
                              Detalle
                            </button>

                            {!isAnulada && (
                              <button
                                onClick={() => handleAbrirAnular(fac)}
                                title="Anular factura y devolver stock (RF-FMC-E10)"
                                className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors text-xs font-semibold cursor-pointer"
                              >
                                Anular
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </GlassCard>

      ) : (

        /* ── SECCIÓN B: CENTRO DE ALERTAS DE MOSTRADOR ── */
        <GlassCard padding="lg" className="space-y-4">
          
          {/* Filtros de Alertas */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Prioridad:</span>
              {(['todas', 'urgente', 'normal'] as const).map((prio) => (
                <button
                  key={prio}
                  onClick={() => setFiltroPrioridadAlerta(prio)}
                  className={`
                    px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer
                    ${
                      filtroPrioridadAlerta === prio
                        ? 'bg-[#e3b341] text-[#0d1630]'
                        : 'bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
                    }
                  `}
                >
                  {prio}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Estado:</span>
              {(['todas', 'pendiente', 'atendido'] as const).map((est) => (
                <button
                  key={est}
                  onClick={() => setFiltroEstadoAlerta(est)}
                  className={`
                    px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer
                    ${
                      filtroEstadoAlerta === est
                        ? 'bg-white/20 text-white'
                        : 'bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]'
                    }
                  `}
                >
                  {est === 'todas' ? 'Todas' : est === 'pendiente' ? 'Pendientes' : 'Atendidas'}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Alertas */}
          {alertas.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-slate-400">
                <UsersRoundIcon size={22} />
              </div>
              <p className="text-xs font-bold text-slate-200 uppercase">Sin alertas operativas activas</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                No hay incidencias reportadas por los cajeros en este momento. Las solicitudes de cambio, soporte o auditoría se reflejarán aquí.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {alertas.map((alt) => {
                const esUrgente = alt.prioridad === 'urgente';
                const esAtendida = alt.estado === 'atendido';

                return (
                  <div
                    key={alt.id}
                    className={`
                      p-4 rounded-xl border transition-all space-y-2.5
                      ${
                        esAtendida
                          ? 'bg-white/[0.01] border-white/[0.06] opacity-75'
                          : esUrgente
                          ? 'bg-red-500/10 border-red-500/30 shadow-[0_4px_20px_rgba(239,68,68,0.15)]'
                          : 'bg-white/[0.02] border-white/[0.08]'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`
                          px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border
                          ${
                            esUrgente
                              ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }
                        `}
                      >
                        {esUrgente ? 'Prioridad Urgente' : 'Prioridad Normal'}
                      </span>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(alt.fechaCreacion).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white font-[family-name:var(--font-archivo)]">
                        {alt.motivo}
                      </h4>
                      {alt.descripcion && (
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          {alt.descripcion}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px]">
                      <span className="text-slate-400">
                        Cajero: <strong className="text-slate-200">{alt.usuarioNombre}</strong>
                      </span>

                      {!esAtendida ? (
                        <button
                          onClick={() => marcarAlerta(alt.id, 'atendido')}
                          disabled={isMutating}
                          className="px-3 py-1 rounded-lg bg-[#10b981]/20 hover:bg-[#10b981]/30 border border-[#10b981]/40 text-[#10b981] font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Marcar Atendido
                        </button>
                      ) : (
                        <span className="text-[#10b981] font-semibold font-mono text-[10px] flex items-center gap-1">
                          ✓ Resuelto
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </GlassCard>

      )}

      {/* 5. Modales Funcionales de Fase 4 */}
      <InvoiceDetailModal
        isOpen={isDetailModalOpen}
        factura={facturaSeleccionada}
        onClose={() => {
          setIsDetailModalOpen(false);
          setFacturaSeleccionada(null);
        }}
        onAnularClick={handleAbrirAnular}
      />

      <VoidInvoiceModal
        isOpen={isVoidModalOpen}
        factura={facturaSeleccionada}
        onClose={() => {
          setIsVoidModalOpen(false);
          setFacturaSeleccionada(null);
        }}
        onAnular={anularFactura}
      />

    </div>
  );
}
