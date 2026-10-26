'use client';

/**
 * NuevoClienteB2BModal.tsx — Modal para registrar un cliente corporativo B2B.
 *
 * Utiliza crearClienteSchema de @warengine/contracts:
 * - NIT / RUT / CC
 * - Razón Social
 * - Teléfono y Dirección obligatorios según RF-FMC-B5.
 */

import React from 'react';
import type { CrearClienteInput, ClienteDto } from '../types';

interface NuevoClienteB2BModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: CrearClienteInput;
  setCampo: <K extends keyof CrearClienteInput>(campo: K, valor: CrearClienteInput[K]) => void;
  errores: Record<string, string>;
  errorGeneral: string | null;
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
  isGuardando,
  onGuardar,
  onClienteCreado,
}: NuevoClienteB2BModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGuardar((nuevo) => {
      onClienteCreado(nuevo);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#14213D] border border-white/10 rounded-2xl shadow-2xl p-6 text-white relative">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <h2 className="text-base font-bold text-[#E9B949] uppercase tracking-wider">
            Registrar Cliente Corporativo (B2B)
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white text-lg font-bold"
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
              {errores.email && (
                <p className="text-red-400 text-[10px] mt-0.5">{errores.email}</p>
              )}
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

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/20 text-white/70 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isGuardando}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#E9B949] to-[#b88a1f] text-[#14213D] font-bold uppercase tracking-wider hover:brightness-110"
            >
              {isGuardando ? 'Guardando...' : 'Registrar Cliente B2B'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
