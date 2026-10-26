'use client';

/**
 * RecentOperationsTable.tsx — Tabla de operaciones y facturación en tiempo real de la sucursal.
 *
 * Principio SOLID: Single Responsibility Principle (SRP).
 * Visualiza las últimas transacciones generadas en los puntos de venta (POS)
 * de la sede activa con formato numérico tabular y badges de estado.
 */

import React from 'react';
import Link from 'next/link';
import { GlassCard } from './GlassCard';
import { StatusBadge } from './StatusBadge';
import { ArrowUpRightIcon, ReceiptTextIcon } from './Icons';
import type { RecentInvoiceItem } from '../types/branch-dashboard.types';

interface RecentOperationsTableProps {
  facturas?: RecentInvoiceItem[];
  onVerTodasClick?: () => void;
  className?: string;
}

export function RecentOperationsTable({
  facturas = [],
  onVerTodasClick,
  className = '',
}: RecentOperationsTableProps) {
  const lista = facturas;

  return (
    <GlassCard padding="lg" className={`flex flex-col justify-between ${className}`}>
      {/* 1. Cabecera con Enlace a Histórico */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-white font-[family-name:var(--font-archivo)]">
            Operaciones recientes
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-400 border border-white/[0.06]">
            {lista.length} registradas
          </span>
        </div>

        {onVerTodasClick ? (
          <button
            onClick={onVerTodasClick}
            className="flex items-center gap-1 text-xs font-semibold text-[#e3b341] hover:text-[#f3d37a] transition-colors cursor-pointer font-[family-name:var(--font-ui)] uppercase"
          >
            <span>Ver todas</span>
            <ArrowUpRightIcon size={14} />
          </button>
        ) : (
          <Link
            href="/pos"
            className="flex items-center gap-1 text-xs font-semibold text-[#e3b341] hover:text-[#f3d37a] transition-colors cursor-pointer font-[family-name:var(--font-ui)] uppercase"
          >
            <span>Ver todas</span>
            <ArrowUpRightIcon size={14} />
          </Link>
        )}
      </div>

      {/* 2. Tabla de Datos de Alta Densidad o Estado Vacío */}
      {lista && lista.length > 0 ? (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] font-bold uppercase tracking-wider text-slate-400 font-[family-name:var(--font-ui)]">
                <th className="py-2 pr-3">Factura / Hora</th>
                <th className="py-2 px-3">Cliente</th>
                <th className="py-2 px-3">Cajero</th>
                <th className="py-2 px-3 text-right">Total COP</th>
                <th className="py-2 pl-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {lista.map((factura) => (
                <tr
                  key={factura.id}
                  className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                >
                  {/* Factura & Hora */}
                  <td className="py-2.5 pr-3 whitespace-nowrap">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono font-medium text-white group-hover:text-[#e3b341] transition-colors">
                        {factura.numero}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {factura.hora}
                      </span>
                    </div>
                  </td>

                  {/* Cliente */}
                  <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-300 font-[family-name:var(--font-archivo)]">
                    {factura.clienteNombre}
                  </td>

                  {/* Cajero */}
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-400 font-[family-name:var(--font-archivo)]">
                    {factura.cajeroNombre}
                  </td>

                  {/* Total COP con Espaciado Tabular */}
                  <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono font-bold text-white tabular-nums">
                    {factura.totalFormateado}
                  </td>

                  {/* Badge de Estado */}
                  <td className="py-2.5 pl-3 whitespace-nowrap text-center">
                    <StatusBadge
                      variant={
                        factura.estado === 'completada'
                          ? 'success'
                          : factura.estado === 'anulada'
                          ? 'danger'
                          : 'warning'
                      }
                      label={
                        factura.estado === 'completada'
                          ? 'Completada'
                          : factura.estado === 'anulada'
                          ? 'Anulada'
                          : 'Pendiente'
                      }
                      size="sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl bg-white/[0.02] border border-white/[0.04] my-auto">
          <div className="w-10 h-10 rounded-xl bg-[#e3b341]/10 border border-[#e3b341]/20 flex items-center justify-center text-[#e3b341] mb-2.5">
            <ReceiptTextIcon size={20} />
          </div>
          <p className="text-xs font-semibold text-slate-200 font-[family-name:var(--font-archivo)]">
            Sin operaciones registradas hoy
          </p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
            Las facturas y transacciones procesadas en los puntos de venta se reflejarán aquí en tiempo real desde la base de datos.
          </p>
        </div>
      )}
    </GlassCard>
  );
}
