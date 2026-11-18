'use client';

import React from 'react';
import { Users, Building2, User, CreditCard, DollarSign } from 'lucide-react';
import { formatCOP } from '@/lib/format/moneda';
import type { ResumenClientesDto } from '../../types/branch-clients.types';

interface ClientSummaryChipsProps {
  resumen: ResumenClientesDto;
  filtroTipo?: 'B2C' | 'B2B';
  filtroCredito?: boolean;
  onSelectFiltro: (cambios: { tipoCliente?: 'B2C' | 'B2B'; creditoHabilitado?: boolean }) => void;
}

export function ClientSummaryChips({
  resumen,
  filtroTipo,
  filtroCredito,
  onSelectFiltro,
}: ClientSummaryChipsProps) {
  const esTotalActivo = !filtroTipo && filtroCredito === undefined;
  const esB2BActivo = filtroTipo === 'B2B';
  const esB2CActivo = filtroTipo === 'B2C';
  const esCreditoActivo = filtroCredito === true;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* Total clientes */}
      <button
        type="button"
        onClick={() => onSelectFiltro({ tipoCliente: undefined, creditoHabilitado: undefined })}
        className={`vidrio p-3.5 rounded-xl text-left transition-all duration-200 border ${
          esTotalActivo
            ? 'border-[#e3b341]/60 shadow-[0_0_15px_rgba(227,179,65,0.15)] bg-white/[0.04]'
            : 'border-white/[0.08] hover:border-white/20'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Total clientes</span>
          <Users className="w-4 h-4 text-slate-400" />
        </div>
        <p className="text-2xl font-bold font-mono text-white tabular-nums">
          {resumen.total}
        </p>
      </button>

      {/* Empresas B2B */}
      <button
        type="button"
        onClick={() =>
          onSelectFiltro({
            tipoCliente: esB2BActivo ? undefined : 'B2B',
          })
        }
        className={`vidrio p-3.5 rounded-xl text-left transition-all duration-200 border ${
          esB2BActivo
            ? 'border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.15)] bg-purple-500/[0.06]'
            : 'border-white/[0.08] hover:border-white/20'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-purple-300/80 mb-1">
          <span>Empresas B2B</span>
          <Building2 className="w-4 h-4 text-purple-400" />
        </div>
        <p className="text-2xl font-bold font-mono text-purple-200 tabular-nums">
          {resumen.b2b}
        </p>
      </button>

      {/* Clientes B2C */}
      <button
        type="button"
        onClick={() =>
          onSelectFiltro({
            tipoCliente: esB2CActivo ? undefined : 'B2C',
          })
        }
        className={`vidrio p-3.5 rounded-xl text-left transition-all duration-200 border ${
          esB2CActivo
            ? 'border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.15)] bg-blue-500/[0.06]'
            : 'border-white/[0.08] hover:border-white/20'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-blue-300/80 mb-1">
          <span>Personas B2C</span>
          <User className="w-4 h-4 text-blue-400" />
        </div>
        <p className="text-2xl font-bold font-mono text-blue-200 tabular-nums">
          {resumen.b2c}
        </p>
      </button>

      {/* Con crédito activo */}
      <button
        type="button"
        onClick={() =>
          onSelectFiltro({
            creditoHabilitado: esCreditoActivo ? undefined : true,
          })
        }
        className={`vidrio p-3.5 rounded-xl text-left transition-all duration-200 border ${
          esCreditoActivo
            ? 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-emerald-500/[0.06]'
            : 'border-white/[0.08] hover:border-white/20'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-emerald-300/80 mb-1">
          <span>Con crédito</span>
          <CreditCard className="w-4 h-4 text-emerald-400" />
        </div>
        <p className="text-2xl font-bold font-mono text-emerald-200 tabular-nums">
          {resumen.conCredito}
        </p>
      </button>

      {/* Saldo pendiente */}
      <div className="vidrio p-3.5 rounded-xl text-left border border-white/[0.08] col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-xs text-[#e3b341]/90 mb-1">
          <span>Saldo a crédito</span>
          <DollarSign className="w-4 h-4 text-[#e3b341]" />
        </div>
        <p className="text-lg font-bold font-mono text-[#e3b341] tabular-nums truncate">
          {formatCOP(resumen.saldoPendienteTotal)}
        </p>
      </div>
    </div>
  );
}
