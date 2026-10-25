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
import { ArrowUpRightIcon } from './Icons';
import type { RecentInvoiceItem } from '../types/branch-dashboard.types';

interface RecentOperationsTableProps {
  facturas?: RecentInvoiceItem[];
  onVerTodasClick?: () => void;
  className?: string;
}

const DEFAULT_FACTURAS: RecentInvoiceItem[] = [
  {
    id: '1',
    numero: 'FE-00897',
    hora: '17:38',
    clienteNombre: 'Constructora Andina',
    cajeroNombre: 'Laura Gómez',
    total: 185000,
    totalFormateado: '$185.000',
    estado: 'completada',
  },
  {
    id: '2',
    numero: 'FE-00896',
    hora: '17:32',
    clienteNombre: 'Ferretería El Roble',
    cajeroNombre: 'Carlos Ruiz',
    total: 320000,
    totalFormateado: '$320.000',
    estado: 'completada',
  },
  {
    id: '3',
    numero: 'FE-00895',
    hora: '17:26',
    clienteNombre: 'Consumidor final',
    cajeroNombre: 'Ana Torres',
    total: 75000,
    totalFormateado: '$75.000',
    estado: 'completada',
  },
  {
    id: '4',
    numero: 'FE-00894',
    hora: '17:21',
    clienteNombre: 'Talleres del Norte',
    cajeroNombre: 'Laura Gómez',
    total: 140000,
    totalFormateado: '$140.000',
    estado: 'completada',
  },
];

export function RecentOperationsTable({
  facturas = DEFAULT_FACTURAS,
  onVerTodasClick,
  className = '',
}: RecentOperationsTableProps) {
  const lista = facturas && facturas.length > 0 ? facturas : DEFAULT_FACTURAS;

  return (
    <GlassCard padding="lg" className={`flex flex-col justify-between ${className}`}>
      {/* 1. Cabecera con Enlace a Histórico */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-base font-semibold text-white font-[family-name:var(--font-archivo)]">
          Operaciones recientes
        </h3>

        {onVerTodasClick ? (
          <button
            onClick={onVerTodasClick}
            className="flex items-center gap-1 text-xs font-semibold text-[#e3b341] hover:text-[#f3d37a] transition-colors cursor-pointer font-[family-name:var(--font-pixelify)] uppercase"
          >
            <span>Ver todas</span>
            <ArrowUpRightIcon size={14} />
          </button>
        ) : (
          <Link
            href="/pos"
            className="flex items-center gap-1 text-xs font-semibold text-[#e3b341] hover:text-[#f3d37a] transition-colors cursor-pointer font-[family-name:var(--font-pixelify)] uppercase"
          >
            <span>Ver todas</span>
            <ArrowUpRightIcon size={14} />
          </Link>
        )}
      </div>

      {/* 2. Tabla de Datos de Alta Densidad */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse select-none">
          <thead>
            <tr className="border-b border-white/[0.08] text-[10px] font-bold uppercase tracking-wider text-slate-400 font-[family-name:var(--font-pixelify)]">
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
    </GlassCard>
  );
}
