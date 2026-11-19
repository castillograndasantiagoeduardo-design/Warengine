'use client';

/**
 * NuevoClienteB2BModal.tsx — Registro de cliente corporativo B2B con evaluación preliminar
 * de cupo de crédito basada en ganancia neta y alerta automática al Super Admin.
 */

import React from 'react';
import { ModalVidrio } from './ModalVidrio';
import { Insignia } from '@/components/Insignia';
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGuardar((nuevo) => onClienteCreado(nuevo));
  };

  return (
    <ModalVidrio
      open={isOpen}
      onClose={onClose}
      title="Registrar cliente corporativo (B2B)"
      description="Datos fiscales y evaluación financiera para solicitud de crédito"
      size="2xl"
    >
      {errorGeneral && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-sans">
          {errorGeneral}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-text-muted font-medium mb-1">Tipo doc.</label>
            <select
              value={form.tipoDocumento}
              onChange={(e) => setCampo('tipoDocumento', e.target.value as 'NIT' | 'RUT' | 'CC')}
              className="w-full superficie-control rounded-xl px-3 py-2 text-text focus:outline-none cursor-pointer"
            >
              <option value="NIT" className="bg-bg text-text">NIT</option>
              <option value="RUT" className="bg-bg text-text">RUT</option>
              <option value="CC" className="bg-bg text-text">CC</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-text-muted font-medium mb-1">Número documento *</label>
            <input
              type="text"
              placeholder="Ej. 900123456-1"
              value={form.numeroDocumento}
              onChange={(e) => setCampo('numeroDocumento', e.target.value)}
              className="w-full superficie-control rounded-xl px-3 py-2 text-text font-mono placeholder-text-muted focus:outline-none"
            />
            {errores.numeroDocumento && (
              <p className="text-red-600 dark:text-red-400 text-[11px] mt-1">{errores.numeroDocumento}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-text-muted font-medium mb-1">Nombre o razón social *</label>
          <input
            type="text"
            placeholder="Ej. Distribuidora Andina S.A.S."
            value={form.nombreRazonSocial}
            onChange={(e) => setCampo('nombreRazonSocial', e.target.value)}
            className="w-full superficie-control rounded-xl px-3 py-2 text-text placeholder-text-muted focus:outline-none"
          />
          {errores.nombreRazonSocial && (
            <p className="text-red-600 dark:text-red-400 text-[11px] mt-1">{errores.nombreRazonSocial}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-text-muted font-medium mb-1">Teléfono corporativo *</label>
            <input
              type="text"
              placeholder="Ej. 3101234567"
              value={form.telefono || ''}
              onChange={(e) => setCampo('telefono', e.target.value)}
              className="w-full superficie-control rounded-xl px-3 py-2 text-text tabular-nums placeholder-text-muted focus:outline-none"
            />
            {errores.telefono && (
              <p className="text-red-600 dark:text-red-400 text-[11px] mt-1">{errores.telefono}</p>
            )}
          </div>
          <div>
            <label className="block text-text-muted font-medium mb-1">Correo electrónico</label>
            <input
              type="email"
              placeholder="compras@empresa.com"
              value={form.email || ''}
              onChange={(e) => setCampo('email', e.target.value)}
              className="w-full superficie-control rounded-xl px-3 py-2 text-text placeholder-text-muted focus:outline-none"
            />
            {errores.email && <p className="text-red-600 dark:text-red-400 text-[11px] mt-1">{errores.email}</p>}
          </div>
        </div>

        <div>
          <label className="block text-text-muted font-medium mb-1">Dirección fiscal / Entrega *</label>
          <input
            type="text"
            placeholder="Ej. Carrera 45 # 26 - 85 Bodega 4"
            value={form.direccion || ''}
            onChange={(e) => setCampo('direccion', e.target.value)}
            className="w-full superficie-control rounded-xl px-3 py-2 text-text placeholder-text-muted focus:outline-none"
          />
          {errores.direccion && (
            <p className="text-red-600 dark:text-red-400 text-[11px] mt-1">{errores.direccion}</p>
          )}
        </div>

        {/* Apartado de Evaluación Financiera y Solicitud de Crédito B2B */}
        <div className="p-4 rounded-xl superficie-control space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-text block">
                Estudio financiero y solicitud de crédito B2B
              </span>
              <span className="text-[11px] text-text-muted">
                Declara la ganancia neta de la empresa para calcular un cupo aproximado sujeto a aval del Super Admin.
              </span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(form.solicitarCredito)}
              onChange={(e) => setCampo('solicitarCredito', e.target.checked)}
              className="h-4 w-4 rounded accent-brand-600 cursor-pointer ml-3 shrink-0"
            />
          </label>

          {form.solicitarCredito && (
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-text-muted font-medium mb-1">Ganancia neta mensual (COP) *</label>
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
                    className="w-full superficie-control rounded-xl px-3 py-2 text-text tabular-nums focus:outline-none"
                  />
                  {errores.gananciaNetaMensual && (
                    <p className="text-red-600 dark:text-red-400 text-[11px] mt-1">{errores.gananciaNetaMensual}</p>
                  )}
                </div>

                <div>
                  <label className="block text-text-muted font-medium mb-1">Antigüedad (meses)</label>
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
                    className="w-full superficie-control rounded-xl px-3 py-2 text-text tabular-nums focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-text-muted font-medium mb-1">Plazo solicitado</label>
                  <select
                    value={form.plazoCreditoDias ?? 30}
                    onChange={(e) => setCampo('plazoCreditoDias', Number(e.target.value) as PlazoCreditoDias)}
                    className="w-full superficie-control rounded-xl px-3 py-2 text-text focus:outline-none cursor-pointer"
                  >
                    <option value={15} className="bg-bg text-text">15 días</option>
                    <option value={30} className="bg-bg text-text">30 días</option>
                    <option value={45} className="bg-bg text-text">45 días</option>
                    <option value={60} className="bg-bg text-text">60 días</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-text-muted font-medium mb-1">Respaldo / Observación financiera</label>
                <input
                  type="text"
                  placeholder="Ej. Estados financieros 2025 y cámara de comercio al día"
                  value={form.observacionFinanciera || ''}
                  onChange={(e) => setCampo('observacionFinanciera', e.target.value)}
                  className="w-full superficie-control rounded-xl px-3 py-2 text-text placeholder-text-muted focus:outline-none"
                />
              </div>

              {isSimulandoCredito ? (
                <p className="text-[11px] text-text-muted font-mono">Calculando cupo sugerido según política...</p>
              ) : evaluacionCredito ? (
                <div className="p-3.5 rounded-xl bg-bg/50 border border-border space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-text-muted">Cupo aproximado sugerido:</span>
                    <span className="text-sm font-titulos font-semibold tabular-nums text-text">
                      ${evaluacionCredito.cupoSugerido.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-text-muted">
                      Cobertura {Math.round(evaluacionCredito.factorAntiguedad * 100)}% × Plazo{' '}
                      {Math.round(evaluacionCredito.factorPlazo * 100)}%
                    </span>
                    <Insignia
                      variante={
                        evaluacionCredito.nivelRiesgo === 'bajo'
                          ? 'success'
                          : evaluacionCredito.nivelRiesgo === 'medio'
                          ? 'warning'
                          : 'danger'
                      }
                      conPunto
                      tamano="sm"
                    >
                      Riesgo {evaluacionCredito.nivelRiesgo}
                    </Insignia>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">{evaluacionCredito.justificacion}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium pt-1">
                    Al registrar la empresa, se enviará una advertencia urgente al Super Admin. El crédito permanecerá bloqueado hasta su aprobación.
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl superficie-control text-xs font-sans font-medium text-text hover:text-text-muted transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isGuardando}
            className="px-5 py-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-btn-primario-texto font-sans font-medium text-xs transition-all cursor-pointer shadow-sm shadow-brand-600/30 disabled:opacity-50"
          >
            {isGuardando ? 'Guardando...' : 'Registrar cliente B2B'}
          </button>
        </div>
      </form>
    </ModalVidrio>
  );
}
