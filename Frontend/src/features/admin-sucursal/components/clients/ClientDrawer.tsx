'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  X,
  Building2,
  User,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Receipt,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { formatCOP } from '@/lib/format/moneda';
import {
  esClienteGenerico,
  obtenerNivelCredito,
  type ClienteDto,
} from '../../types/branch-clients.types';
import type { FacturaDto } from '@warengine/contracts';

interface ClientDrawerProps {
  cliente: ClienteDto | null;
  onClose: () => void;
  onEditar: (cliente: ClienteDto) => void;
  onGestionarCredito: (cliente: ClienteDto) => void;
  cargarFacturas: (clienteId: string) => Promise<FacturaDto[]>;
}

export function ClientDrawer({
  cliente,
  onClose,
  onEditar,
  onGestionarCredito,
  cargarFacturas,
}: ClientDrawerProps) {
  const [facturas, setFacturas] = useState<FacturaDto[]>([]);
  const [cargandoFacturas, setCargandoFacturas] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cliente) return;

    let cancelado = false;
    setCargandoFacturas(true);

    cargarFacturas(cliente.id)
      .then((res) => {
        if (!cancelado) setFacturas(res);
      })
      .catch(() => {
        if (!cancelado) setFacturas([]);
      })
      .finally(() => {
        if (!cancelado) setCargandoFacturas(false);
      });

    return () => {
      cancelado = true;
    };
  }, [cliente, cargarFacturas]);

  // Manejo de Escape
  useEffect(() => {
    if (!cliente) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cliente, onClose]);

  if (!cliente) return null;

  const esGen = esClienteGenerico(cliente);
  const nivelCredito = obtenerNivelCredito(cliente.creditoHabilitado, cliente.saldoPendiente);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Ficha de ${cliente.nombreRazonSocial}`}
    >
      <div
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg h-full bg-[#160a14] border-l border-white/10 shadow-2xl flex flex-col justify-between overflow-y-auto"
      >
        {/* Cabecera del Drawer */}
        <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase border ${
                  cliente.tipoCliente === 'B2B'
                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                }`}
              >
                {cliente.tipoCliente === 'B2B' ? (
                  <>
                    <Building2 className="w-3 h-3" /> Corporativo B2B
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3" /> Persona B2C
                  </>
                )}
              </span>
              {esGen && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Genérico
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white leading-tight">
              {cliente.nombreRazonSocial}
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-1">
              {cliente.tipoDocumento}: <span className="text-slate-200">{cliente.numeroDocumento}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel lateral"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Drawer */}
        <div className="p-6 space-y-6 flex-1">
          {/* Datos de contacto */}
          <div className="vidrio p-4 rounded-xl border border-white/[0.08] space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Datos de contacto
            </h3>

            <div className="grid grid-cols-1 gap-2.5 text-sm">
              <div className="flex items-center gap-2.5 text-slate-300">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{cliente.telefono || 'Sin teléfono registrado'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{cliente.email || 'Sin correo registrado'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{cliente.direccion || 'Sin dirección registrada'}</span>
              </div>
            </div>
          </div>

          {/* Bloque de crédito */}
          <div className="vidrio p-4 rounded-xl border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#e3b341]" />
                Estado crediticio
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                  nivelCredito.color === 'verde'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : nivelCredito.color === 'ambar'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : nivelCredito.color === 'rojo'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-white/[0.06] text-slate-400 border-white/10'
                }`}
              >
                {cliente.creditoHabilitado ? 'Crédito Habilitado' : 'Sin crédito'}
              </span>
            </div>

            <div className="pt-2">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-slate-400">Saldo pendiente acumulado:</span>
                <span className="text-lg font-bold font-mono text-[#e3b341] tabular-nums">
                  {formatCOP(cliente.saldoPendiente ?? 0)}
                </span>
              </div>

              {/* Barra indicadora visual */}
              {cliente.creditoHabilitado && (
                <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      nivelCredito.color === 'verde'
                        ? 'bg-emerald-500 w-[15%]'
                        : nivelCredito.color === 'ambar'
                        ? 'bg-amber-500 w-[60%]'
                        : 'bg-rose-500 w-[90%]'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Botón gestionar crédito */}
            {!esGen && cliente.tipoCliente === 'B2B' && (
              <button
                type="button"
                onClick={() => onGestionarCredito(cliente)}
                className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Gestionar línea de crédito</span>
              </button>
            )}
          </div>

          {/* Últimas facturas */}
          <div className="vidrio p-4 rounded-xl border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-purple-400" />
                Últimas facturas
              </h3>
              <Link
                href={`/admin-sucursal/facturacion?q=${encodeURIComponent(cliente.numeroDocumento)}`}
                className="text-xs text-[#e3b341] hover:underline flex items-center gap-1"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {cargandoFacturas ? (
              <div className="flex items-center justify-center py-6 text-slate-400 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#e3b341]" />
                <span>Cargando historial de facturas...</span>
              </div>
            ) : facturas.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Este cliente no registra facturas emitidas en esta sede.
              </div>
            ) : (
              <div className="space-y-2">
                {facturas.map((fac) => (
                  <div
                    key={fac.id}
                    className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-mono font-bold text-white">
                        Folio #{fac.consecutivo}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {new Date(fac.fecha).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-[#e3b341]">
                        {formatCOP(fac.total)}
                      </p>
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-mono uppercase ${
                          fac.estado === 'emitida'
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-rose-400 bg-rose-500/10'
                        }`}
                      >
                        {fac.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pie del Drawer */}
        <div className="p-4 border-t border-white/[0.08] flex items-center justify-end gap-2 bg-[#120710]">
          {!esGen && (
            <button
              type="button"
              onClick={() => onEditar(cliente)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 transition-colors"
            >
              Editar datos
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-transparent transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
