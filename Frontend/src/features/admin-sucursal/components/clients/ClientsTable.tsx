'use client';

import React from 'react';
import { Eye, Edit3, CreditCard, Building2, User, ShieldAlert } from 'lucide-react';
import { formatCOP } from '@/lib/format/moneda';
import {
  esClienteGenerico,
  obtenerNivelCredito,
  type ClienteDto,
} from '../../types/branch-clients.types';

interface ClientsTableProps {
  clientes: ClienteDto[];
  onVerFicha: (cliente: ClienteDto) => void;
  onEditar: (cliente: ClienteDto) => void;
  onGestionarCredito: (cliente: ClienteDto) => void;
}

export function ClientsTable({
  clientes,
  onVerFicha,
  onEditar,
  onGestionarCredito,
}: ClientsTableProps) {
  return (
    <div className="vidrio rounded-2xl border border-white/[0.08] overflow-hidden">
      {/* Vista de escritorio: Tabla semántica */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-[11px] font-mono uppercase bg-white/[0.03] text-slate-400 border-b border-white/[0.06]">
            <tr>
              <th scope="col" className="py-3 px-4">
                Documento
              </th>
              <th scope="col" className="py-3 px-4">
                Cliente / Razón Social
              </th>
              <th scope="col" className="py-3 px-4 text-center">
                Tipo
              </th>
              <th scope="col" className="py-3 px-4">
                Contacto
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                Crédito / Saldo
              </th>
              <th scope="col" className="py-3 px-4 text-center">
                Estado
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {clientes.map((c) => {
              const esGen = esClienteGenerico(c);
              const nivelCredito = obtenerNivelCredito(c.creditoHabilitado, c.saldoPendiente);

              return (
                <tr
                  key={c.id}
                  className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  onClick={() => onVerFicha(c)}
                >
                  {/* Documento */}
                  <td className="py-3.5 px-4 font-mono text-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 mr-1.5 px-1.5 py-0.5 rounded bg-white/[0.05]">
                      {c.tipoDocumento}
                    </span>
                    <span className="tabular-nums font-medium">{c.numeroDocumento}</span>
                  </td>

                  {/* Nombre / Razón Social */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white group-hover:text-[#e3b341] transition-colors">
                        {c.nombreRazonSocial}
                      </span>
                      {esGen && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Genérico
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Tipo */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase border ${
                        c.tipoCliente === 'B2B'
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                      }`}
                    >
                      {c.tipoCliente === 'B2B' ? (
                        <>
                          <Building2 className="w-3 h-3" /> B2B
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3" /> B2C
                        </>
                      )}
                    </span>
                  </td>

                  {/* Contacto */}
                  <td className="py-3.5 px-4 text-xs text-slate-400">
                    <div className="truncate max-w-[200px]">
                      {c.telefono ? <span className="text-slate-300">{c.telefono}</span> : '—'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                      {c.email || '—'}
                    </div>
                  </td>

                  {/* Crédito */}
                  <td className="py-3.5 px-4 text-right">
                    {c.creditoHabilitado ? (
                      <div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                            nivelCredito.color === 'verde'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : nivelCredito.color === 'ambar'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {nivelCredito.etiqueta}
                        </span>
                        {(c.saldoPendiente ?? 0) > 0 && (
                          <p className="font-mono text-xs font-semibold text-[#e3b341] tabular-nums mt-0.5">
                            {formatCOP(c.saldoPendiente ?? 0)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 font-mono">Sin crédito</span>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Activo
                    </span>
                  </td>

                  {/* Acciones */}
                  <td
                    className="py-3.5 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {/* Ver ficha */}
                      <button
                        type="button"
                        onClick={() => onVerFicha(c)}
                        title="Ver ficha del cliente"
                        aria-label={`Ver ficha de ${c.nombreRazonSocial}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Editar */}
                      {!esGen && (
                        <button
                          type="button"
                          onClick={() => onEditar(c)}
                          title="Editar cliente"
                          aria-label={`Editar ${c.nombreRazonSocial}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#e3b341] hover:bg-white/[0.08] transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Gestionar crédito (solo B2B no genérico) */}
                      {!esGen && c.tipoCliente === 'B2B' && (
                        <button
                          type="button"
                          onClick={() => onGestionarCredito(c)}
                          title="Gestionar crédito corporativo"
                          aria-label={`Gestionar crédito de ${c.nombreRazonSocial}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/[0.08] transition-colors"
                        >
                          <CreditCard className="w-4 h-4" />
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

      {/* Vista móvil: Tarjetas apiladas */}
      <div className="block md:hidden divide-y divide-white/[0.06]">
        {clientes.map((c) => {
          const esGen = esClienteGenerico(c);
          const nivelCredito = obtenerNivelCredito(c.creditoHabilitado, c.saldoPendiente);

          return (
            <div
              key={c.id}
              onClick={() => onVerFicha(c)}
              className="p-4 space-y-3 hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-base">
                      {c.nombreRazonSocial}
                    </span>
                    {esGen && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Genérico
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    {c.tipoDocumento} {c.numeroDocumento}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase border ${
                    c.tipoCliente === 'B2B'
                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                      : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  }`}
                >
                  {c.tipoCliente}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/[0.04]">
                <div>
                  <span className="text-[10px] text-slate-500 block">Contacto</span>
                  <span className="text-slate-300">{c.telefono || c.email || '—'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Crédito</span>
                  {c.creditoHabilitado ? (
                    <span className="font-mono text-emerald-300 font-medium">
                      {(c.saldoPendiente ?? 0) > 0 ? formatCOP(c.saldoPendiente ?? 0) : 'Al día'}
                    </span>
                  ) : (
                    <span className="text-slate-500">Sin crédito</span>
                  )}
                </div>
              </div>

              {/* Botones móviles */}
              <div
                className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.04]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onVerFicha(c)}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-slate-300 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10"
                >
                  Ver ficha
                </button>
                {!esGen && (
                  <button
                    type="button"
                    onClick={() => onEditar(c)}
                    className="px-3 py-1 rounded-lg text-xs font-medium text-[#e3b341] bg-[#e3b341]/10 hover:bg-[#e3b341]/20 border border-[#e3b341]/30"
                  >
                    Editar
                  </button>
                )}
                {!esGen && c.tipoCliente === 'B2B' && (
                  <button
                    type="button"
                    onClick={() => onGestionarCredito(c)}
                    className="px-3 py-1 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30"
                  >
                    Crédito
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
