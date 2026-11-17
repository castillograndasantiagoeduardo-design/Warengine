'use client';

/**
 * NuevoClienteB2BModal.tsx — Registro de cliente corporativo B2B con evaluación preliminar
 * de cupo de crédito basada en ganancia neta y alerta automática al Super Admin.
 */

import React from 'react';
import type {
  ClienteDto,
  CrearClienteInput,
  EvaluacionCreditoB2BDto,
  PlazoCreditoDias,
} from '../types';

interface NuevoClienteB2BModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: CrearClienteInput;
  setCampo: <K extends keyof CrearClienteInput>(campo: K, valor: CrearClienteInput[K]) => void;
  errores: Record<string, string>;
  errorGeneral: string | null;
  evaluacionCredito: EvaluacionCreditoB2BDto | null;
  isSimulandoCredito: boolean;
  isGuardando: boolean;
  onGuardar: (onSuccess: (nuevo: ClienteDto) => void) => void;
  onClienteCreado: (nuevo: ClienteDto) => void;
}

const RIESGO_STYLE = {
  bajo: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  medio: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  alto: 'bg-red-500/20 text-red-300 border-red-500/40',
} as const;

export function NuevoClienteB2BModal({
  isOpen,
  onClose,
  form,
  setCampo,
  errores,
  errorGeneral,
  evaluacionCredito,
  isSimulandoCredito,
  isGuardando,
  onGuardar,
  onClienteCreado,
}: NuevoClienteB2BModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGuardar((nuevo) => onClienteCreado(nuevo));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-[#14213D] border border-white/10 rounded-2xl shadow-2xl p-6 text-white relative my-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <h2 className="text-base font-semibold text-[#E9B949] uppercase tracking-wider">
            Registrar Cliente Corporativo (B2B)
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white text-lg cursor-pointer"
          >
            &times;
          </button>
        </div>

        {errorGeneral && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs">
            {errorGeneral}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-white/70 mb-1">Tipo Doc.</label>
              <select
                value={form.tipoDocumento}
                onChange={(e) => setCampo('tipoDocumento', e.target.value as 'NIT' | 'RUT' | 'CC')}
                className="w-full bg-[#0d1630] border border-white/10 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-[#E9B949]"
              >
                <option value="NIT">NIT</option>
                <option value="RUT">RUT</option>
                <option value="CC">CC</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-white/70 mb-1">Número Documento *</label>
              <input
                type="text"
                placeholder="Ej. 900123456-1"
                value={form.numeroDocumento}
                onChange={(e) => setCampo('numeroDocumento', e.target.value)}
                className="w-full bg-[#0d1630] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#E9B949]"
              />
              {errores.numeroDocumento && (
                <p className="text-red-400 text-[10px] mt-0.5">{errores.numeroDocumento}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-white/70 mb-1">Nombre o Razón Social *</label>
            <input
              type="text"
              placeholder="Ej. Distribuidora Andina S.A.S."
              value={form.nombreRazonSocial}
              onChange={(e) => setCampo('nombreRazonSocial', e.target.value)}
              className="w-full bg-[#0d1630] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#E9B949]"
            />
            {errores.nombreRazonSocial && (
              <p className="text-red-400 text-[10px] mt-0.5">{errores.nombreRazonSocial}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-white/70 mb-1">Teléfono Corporativo *</label>
              <input
                type="text"
                placeholder="Ej. 3101234567"
                value={form.telefono || ''}
                onChange={(e) => setCampo('telefono', e.target.value)}
                className="w-full bg-[#0d1630] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#E9B949]"
              />
              {errores.telefono && (
                <p className="text-red-400 text-[10px] mt-0.5">{errores.telefono}</p>
              )}
            </div>
            <div>
              <label className="block text-white/70 mb-1">Correo Electrónico</label>
              <input
                type="email"
                placeholder="compras@empresa.com"
                value={form.email || ''}
                onChange={(e) => setCampo('email', e.target.value)}
                className="w-full bg-[#0d1630] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#E9B949]"
              />
              {errores.email && <p className="text-red-400 text-[10px] mt-0.5">{errores.email}</p>}
            </div>
          </div>

          <div>
            <label className="block text-white/70 mb-1">Dirección Fiscal / Entrega *</label>
            <input
              type="text"
              placeholder="Ej. Carrera 45 # 26 - 85 Bodega 4"
              value={form.direccion || ''}
              onChange={(e) => setCampo('direccion', e.target.value)}
              className="w-full bg-[#0d1630] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#E9B949]"
            />
            {errores.direccion && (
              <p className="text-red-400 text-[10px] mt-0.5">{errores.direccion}</p>
            )}
          </div>

          {/* Apartado de Evaluación Financiera y Solicitud de Crédito B2B */}
          <div className="p-3.5 rounded-xl bg-[#0d1630] border border-[#E9B949]/30 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-[#E9B949] block">
                  Estudio Financiero y Solicitud de Crédito B2B
                </span>
                <span className="text-[11px] text-white/60">
                  Declara la ganancia neta de la empresa para calcular un cupo aproximado sujeto a aval del Super Admin.
                </span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(form.solicitarCredito)}
                onChange={(e) => setCampo('solicitarCredito', e.target.checked)}
                className="h-4 w-4 accent-[#E9B949] cursor-pointer ml-3 shrink-0"
              />
            </label>

            {form.solicitarCredito && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <label className="block text-white/70 mb-1">Ganancia neta mensual (COP) *</label>
                    <input
                      type="number"
                      min={0}
                      step={100000}
                      placeholder="Ej. 20000000"
                      value={form.gananciaNetaMensual ?? ''}
                      onChange={(e) =>
                        setCampo(
                          'gananciaNetaMensual',
                          e.target.value === '' ? undefined : Number(e.target.value),
                        )
                      }
                      className="w-full bg-[#14213D] border border-white/10 rounded-xl px-3 py-2 text-white tabular-nums focus:outline-none focus:border-[#E9B949]"
                    />
                    {errores.gananciaNetaMensual && (
                      <p className="text-red-400 text-[10px] mt-0.5">{errores.gananciaNetaMensual}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1">Antigüedad (meses)</label>
                    <input
                      type="number"
                      min={0}
                      max={1200}
                      placeholder="Ej. 24"
                      value={form.antiguedadEmpresaMeses ?? ''}
                      onChange={(e) =>
                        setCampo(
                          'antiguedadEmpresaMeses',
                          e.target.value === '' ? undefined : Number(e.target.value),
                        )
                      }
                      className="w-full bg-[#14213D] border border-white/10 rounded-xl px-3 py-2 text-white tabular-nums focus:outline-none focus:border-[#E9B949]"
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1">Plazo solicitado</label>
                    <select
                      value={form.plazoCreditoDias ?? 30}
                      onChange={(e) => setCampo('plazoCreditoDias', Number(e.target.value) as PlazoCreditoDias)}
                      className="w-full bg-[#14213D] border border-white/10 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-[#E9B949]"
                    >
                      <option value={15}>15 días</option>
                      <option value={30}>30 días</option>
                      <option value={45}>45 días</option>
                      <option value={60}>60 días</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 mb-1">Respaldo / Observación financiera</label>
                  <input
                    type="text"
                    placeholder="Ej. Estados financieros 2025 y cámara de comercio al día"
                    value={form.observacionFinanciera || ''}
                    onChange={(e) => setCampo('observacionFinanciera', e.target.value)}
                    className="w-full bg-[#14213D] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#E9B949]"
                  />
                </div>

                {isSimulandoCredito ? (
                  <p className="text-[11px] text-white/60">Calculando cupo sugerido según política...</p>
                ) : evaluacionCredito ? (
                  <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-white/70">Cupo aproximado sugerido:</span>
                      <span className="text-sm font-semibold tabular-nums text-[#E9B949]">
                        ${evaluacionCredito.cupoSugerido.toLocaleString('es-CO')} COP
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-white/60">
                        Cobertura {Math.round(evaluacionCredito.factorAntiguedad * 100)}% × Plazo{' '}
                        {Math.round(evaluacionCredito.factorPlazo * 100)}%
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] border uppercase ${RIESGO_STYLE[evaluacionCredito.nivelRiesgo]}`}
                      >
                        Riesgo {evaluacionCredito.nivelRiesgo}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/70 leading-relaxed">{evaluacionCredito.justificacion}</p>
                    <p className="text-[11px] text-amber-300/90 font-medium pt-1">
                      Al registrar la empresa, se enviará una advertencia urgente al Super Admin. El crédito permanecerá bloqueado hasta su aprobación.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/20 text-white/70 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isGuardando}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#E9B949] to-[#b88a1f] text-[#14213D] font-semibold uppercase tracking-wider hover:brightness-110 cursor-pointer disabled:opacity-50"
            >
              {isGuardando ? 'Guardando...' : 'Registrar Cliente B2B'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
