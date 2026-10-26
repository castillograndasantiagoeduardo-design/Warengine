'use client';

/**
 * BranchMovementsView.tsx — Vista principal de movimientos de almacén y auditoría Kardex de la sede.
 * 
 * Principios SOLID:
 * - Single Responsibility Principle (SRP): Trazabilidad cronológica inmutable de existencias (RF-ADM-B10),
 *   asentamiento de entradas (RF-ADM-B7), salidas justificadas (RF-ADM-B8) y conteos físicos (RF-ADM-B17).
 * - Dependency Inversion Principle (DIP): Orquestado por useInventoryMovements y useBranchInventory.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useInventoryMovements } from '../hooks/useInventoryMovements';
import { useBranchInventory } from '../hooks/useBranchInventory';
import { GlassCard } from './GlassCard';
import { Button3D } from '@/components/ui/Button3D';
import { RegisterStockEntryModal } from './RegisterStockEntryModal';
import { ManualExitModal } from './ManualExitModal';
import { StockCountAuditModal } from './StockCountAuditModal';
import {
  BoxesIcon,
  RefreshCwIcon,
  SearchIcon,
  TrendingUpIcon,
  ShieldIcon,
  TruckIcon,
} from './Icons';
import type {
  ProductoInventarioSede,
  MovimientoKardexItem,
  AjustarInventarioDTO,
  FiltrosKardexDTO,
} from '../types/branch-inventory.types';

interface BranchMovementsViewProps {
  sucursalId: number;
  sucursalNombre?: string;
  className?: string;
}

export function BranchMovementsView({
  sucursalId,
  sucursalNombre,
  className = '',
}: BranchMovementsViewProps) {
  const { productos, proveedores, recargar: recargarInventario } = useBranchInventory({ sucursalId });

  const {
    isSubmitting,
    isKardexLoading,
    kardexData,
    errorMsg,
    registrarEntrada,
    registrarSalida,
    ajustarInventario,
    consultarKardex,
    exportarCsv,
  } = useInventoryMovements();

  // Filtros reactivos
  const [productoFiltro, setProductoFiltro] = useState<string>('todos');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  // Modales operativos
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoInventarioSede | null>(null);

  const cargarKardex = useCallback(() => {
    consultarKardex({
      sucursalId,
      productoId: productoFiltro !== 'todos' ? productoFiltro : undefined,
      tipo: tipoFiltro !== 'todos' ? (tipoFiltro as FiltrosKardexDTO['tipo']) : undefined,
      limit: 100,
    });
  }, [sucursalId, productoFiltro, tipoFiltro, consultarKardex]);

  useEffect(() => {
    cargarKardex();
  }, [cargarKardex]);

  const formatearFecha = (fecha: string | Date) => {
    const d = new Date(fecha);
    return isNaN(d.getTime())
      ? String(fecha)
      : new Intl.DateTimeFormat('es-CO', {
          dateStyle: 'short',
          timeStyle: 'medium',
        }).format(d);
  };

  // Filtrado reactivo en memoria
  const movimientosFiltrados = useMemo(() => {
    return (kardexData.items || []).filter((m) => {
      if (!busqueda.trim()) return true;
      const term = busqueda.toLowerCase().trim();
      const matchProd = (m.productoNombre || '').toLowerCase().includes(term);
      const matchSku = (m.productoSku || '').toLowerCase().includes(term);
      const matchMotivo = (m.motivo || '').toLowerCase().includes(term);
      const matchDoc = (m.facturaId || m.devolucionId || '').toLowerCase().includes(term);
      return matchProd || matchSku || matchMotivo || matchDoc;
    });
  }, [kardexData.items, busqueda]);

  // Contadores para KPIs
  const kpis = useMemo(() => {
    const items = kardexData.items || [];
    let entradas = 0;
    let salidas = 0;
    let ajustes = 0;

    items.forEach((m) => {
      if (m.tipo === 'entrada') entradas += m.cantidad;
      else if (m.tipo === 'salida') salidas += Math.abs(m.cantidad);
      else if (m.tipo === 'ajuste_entrada' || m.tipo === 'ajuste_salida') ajustes += 1;
    });

    return {
      totalMovimientos: items.length,
      entradasUnidades: entradas,
      salidasUnidades: salidas,
      ajustesConteo: ajustes,
    };
  }, [kardexData.items]);

  const handleDescargarCsv = () => {
    exportarCsv({
      sucursalId,
      productoId: productoFiltro !== 'todos' ? productoFiltro : undefined,
      tipo: tipoFiltro !== 'todos' ? (tipoFiltro as FiltrosKardexDTO['tipo']) : undefined,
    });
  };

  const badgePorTipo = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'salida':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'ajuste_entrada':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'ajuste_salida':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className={`space-y-5 animate-in fade-in duration-300 ${className}`}>
      
      {/* 1. Encabezado de Movimientos & Auditoría */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/[0.04]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-[family-name:var(--font-anton)] tracking-wider text-white uppercase">
              Movimientos Sede & Auditoría
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-[#e3b341]/10 text-[#e3b341] border border-[#e3b341]/25 font-[family-name:var(--font-ui)]">
              {sucursalNombre}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-[family-name:var(--font-archivo)] mt-0.5">
            Kardex cronológico inmutable (RF-ADM-B10), trazabilidad de entradas/salidas y auditoría física de existencias.
          </p>
        </div>

        {/* Acciones Rápidas Operativas */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={cargarKardex}
            disabled={isKardexLoading}
            title="Sincronizar Kardex"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCwIcon size={14} className={isKardexLoading ? 'animate-spin text-[#e3b341]' : ''} />
          </button>

          <button
            onClick={handleDescargarCsv}
            disabled={isSubmitting || kardexData.items.length === 0}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer text-xs font-semibold font-[family-name:var(--font-archivo)] disabled:opacity-50"
          >
            <span>📥 Exportar CSV</span>
          </button>

          <Button3D
            size="sm"
            onClick={() => {
              setProductoSeleccionado(null);
              setIsEntryModalOpen(true);
            }}
            className="font-bold font-[family-name:var(--font-ui)] tracking-wide uppercase text-xs h-9"
          >
            <span>+ Registrar Entrada</span>
          </Button3D>

          <button
            onClick={() => {
              setProductoSeleccionado(null);
              setIsExitModalOpen(true);
            }}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 transition-colors cursor-pointer text-xs font-semibold font-[family-name:var(--font-archivo)]"
          >
            <span>- Salida / Merma</span>
          </button>

          <button
            onClick={() => {
              setProductoSeleccionado(null);
              setIsAuditModalOpen(true);
            }}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-colors cursor-pointer text-xs font-semibold font-[family-name:var(--font-archivo)]"
          >
            <span>⚖ Auditoría Física</span>
          </button>
        </div>
      </div>

      {/* Banner de Error si ocurre */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            onClick={cargarKardex}
            className="text-xs underline text-red-200 hover:text-white font-semibold cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* 2. Tarjetas KPI de Resumen de Movimientos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Asentamientos */}
        <div className="p-4 rounded-2xl bg-[#09132b]/80 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Total Asentamientos</span>
            <p className="text-lg font-bold font-mono text-white mt-0.5">
              {kpis.totalMovimientos}
            </p>
            <span className="text-[10px] text-[#e3b341] font-semibold">Trazabilidad inmutable</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e3b341]/15 text-[#e3b341] border border-[#e3b341]/30">
            <BoxesIcon size={18} />
          </div>
        </div>

        {/* KPI 2: Entradas de Mercancía */}
        <div className="p-4 rounded-2xl bg-[#09132b]/80 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Entradas de Stock</span>
            <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              +{kpis.entradasUnidades} uds
            </p>
            <span className="text-[10px] text-slate-400">Compras y transferencias</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <TruckIcon size={18} />
          </div>
        </div>

        {/* KPI 3: Salidas y Bajas */}
        <div className="p-4 rounded-2xl bg-[#09132b]/80 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Salidas / Mermas</span>
            <p className="text-lg font-bold font-mono text-rose-400 mt-0.5">
              -{kpis.salidasUnidades} uds
            </p>
            <span className="text-[10px] text-slate-400">Bajas justificadas de sede</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <TrendingUpIcon size={18} />
          </div>
        </div>

        {/* KPI 4: Ajustes de Conteo Físico */}
        <div className="p-4 rounded-2xl bg-[#09132b]/80 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Arqueos de Conteo</span>
            <p className="text-lg font-bold font-mono text-amber-400 mt-0.5">
              {kpis.ajustesConteo} auditorías
            </p>
            <span className="text-[10px] text-amber-400/90 font-semibold">Discrepancias cuadradas</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <ShieldIcon size={18} />
          </div>
        </div>

      </div>

      {/* 3. Panel de Tabla Kardex con Filtros Combinables */}
      <GlassCard padding="lg" className="space-y-4">
        
        {/* Barra de Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon size={14} />
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por producto, código SKU o motivo..."
              className="w-full h-9 pl-9 pr-3 text-xs text-white placeholder-slate-400 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:border-[#e3b341]/60 focus:ring-1 focus:ring-[#e3b341]/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filtro por Producto */}
            <select
              value={productoFiltro}
              onChange={(e) => setProductoFiltro(e.target.value)}
              className="h-9 px-3 rounded-xl bg-[#0d1630] border border-white/[0.1] text-xs text-slate-200 focus:outline-none focus:border-[#e3b341]/60"
            >
              <option value="todos">Todos los productos</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.nombre}
                </option>
              ))}
            </select>

            {/* Filtro por Tipo de Movimiento */}
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="h-9 px-3 rounded-xl bg-[#0d1630] border border-white/[0.1] text-xs text-slate-200 focus:outline-none focus:border-[#e3b341]/60"
            >
              <option value="todos">Todos los tipos</option>
              <option value="entrada">Entradas de Stock (+)</option>
              <option value="salida">Salidas / Mermas (-)</option>
              <option value="ajuste_entrada">Ajuste Físico (+)</option>
              <option value="ajuste_salida">Ajuste Físico (-)</option>
            </select>
          </div>

        </div>

        {/* Tabla de Movimientos Kardex */}
        {movimientosFiltrados.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-slate-400">
              <BoxesIcon size={22} />
            </div>
            <p className="text-xs font-bold text-slate-200 uppercase">Sin movimientos registrados</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              No hay movimientos de stock que coincidan con los filtros aplicados. Las entradas de compras, salidas y ajustes quedarán registradas aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#09132b] text-[10px] uppercase font-mono tracking-wider text-slate-400 border-b border-white/[0.08]">
                <tr>
                  <th className="py-3 px-3">Fecha y Hora</th>
                  <th className="py-3 px-3">Producto / SKU</th>
                  <th className="py-3 px-3 text-center">Tipo</th>
                  <th className="py-3 px-3 text-center">Cantidad</th>
                  <th className="py-3 px-3 text-right">Saldo Resultante</th>
                  <th className="py-3 px-3">Motivo / Referencia</th>
                  <th className="py-3 px-3">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {movimientosFiltrados.map((m) => {
                  const esPositivo = m.cantidad > 0;
                  return (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                        {formatearFecha(m.fecha)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-white block">{m.productoNombre || m.productoId}</span>
                        <span className="text-[10px] font-mono text-slate-400">{m.productoSku || '—'}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`
                            px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border
                            ${badgePorTipo(m.tipo)}
                          `}
                        >
                          {m.tipo.replace('_', ' ')}
                        </span>
                      </td>
                      <td
                        className={`
                          py-3 px-3 text-center font-mono font-bold
                          ${esPositivo ? 'text-emerald-400' : 'text-rose-400'}
                        `}
                      >
                        {esPositivo ? `+${m.cantidad}` : m.cantidad}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {m.stockResultante != null ? m.stockResultante : '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-300 max-w-xs truncate" title={m.motivo || ''}>
                        {m.facturaId ? (
                          <span className="font-mono text-[11px] text-[#e3b341] block">
                            Fact: {m.facturaId}
                          </span>
                        ) : m.devolucionId ? (
                          <span className="font-mono text-[11px] text-purple-400 block">
                            Dev: {m.devolucionId}
                          </span>
                        ) : null}
                        <span className="text-[11px] text-slate-400">{m.motivo || '—'}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {m.usuarioNombre || 'Sistema'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </GlassCard>

      {/* 4. Modales Funcionales Operativos */}
      <RegisterStockEntryModal
        isOpen={isEntryModalOpen}
        sucursalId={sucursalId}
        productos={productos}
        proveedores={proveedores}
        productoInicial={productoSeleccionado}
        onClose={() => {
          setIsEntryModalOpen(false);
          setProductoSeleccionado(null);
        }}
        onRegistrar={async (dto) => {
          const res = await registrarEntrada(dto);
          if (res.ok) {
            cargarKardex();
            recargarInventario();
          }
          return res;
        }}
      />

      <ManualExitModal
        isOpen={isExitModalOpen}
        sucursalId={sucursalId}
        productos={productos}
        productoInicial={productoSeleccionado}
        onClose={() => {
          setIsExitModalOpen(false);
          setProductoSeleccionado(null);
        }}
        onRegistrar={async (dto) => {
          const res = await registrarSalida(dto);
          if (res.ok) {
            cargarKardex();
            recargarInventario();
          }
          return res;
        }}
      />

      <StockCountAuditModal
        isOpen={isAuditModalOpen}
        sucursalId={sucursalId}
        productos={productos}
        productoInicial={productoSeleccionado}
        onClose={() => {
          setIsAuditModalOpen(false);
          setProductoSeleccionado(null);
        }}
        onAjustar={async (dto: AjustarInventarioDTO) => {
          const res = await ajustarInventario(dto);
          if (res.ok) {
            cargarKardex();
            recargarInventario();
          }
          return res;
        }}
      />

    </div>
  );
}
