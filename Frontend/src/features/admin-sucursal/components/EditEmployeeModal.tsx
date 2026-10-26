'use client';

/**
 * EditEmployeeModal.tsx — Modal para actualizar datos de un colaborador de sede (RF-ADM-C12).
 * 
 * Principio SOLID: Single Responsibility Principle (SRP).
 */

import React, { useState, useEffect } from 'react';
import { Button3D } from '@/components/ui/Button3D';
import { UsersRoundIcon } from './Icons';
import type { EmpleadoSede, EditarEmpleadoDTO } from '../types/branch-staff.types';

interface EditEmployeeModalProps {
  isOpen: boolean;
  empleado: EmpleadoSede | null;
  onClose: () => void;
  onGuardar: (id: string, data: EditarEmpleadoDTO) => Promise<{ ok: boolean; error?: string }>;
}

export function EditEmployeeModal({
  isOpen,
  empleado,
  onClose,
  onGuardar,
}: EditEmployeeModalProps) {
  const [nombre, setNombre] = useState('');
  const [cargo, setCargo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (empleado) {
      setNombre(empleado.nombre || '');
      setCargo(empleado.cargo || '');
      setTelefono(empleado.telefono || '');
      setDireccion(empleado.direccion || '');
      setIsActive(empleado.isActive);
      setErrorMsg(null);
    }
  }, [empleado]);

  if (!isOpen || !empleado) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombre.trim()) {
      setErrorMsg('El nombre del colaborador es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onGuardar(empleado.id, {
        nombre: nombre.trim(),
        cargo: cargo.trim() || null,
        telefono: telefono.trim() || null,
        direccion: direccion.trim() || null,
        isActive,
      });

      if (res.ok) {
        onClose();
      } else {
        setErrorMsg(res.error || 'No fue posible guardar los cambios.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="
          relative w-full max-w-lg overflow-hidden rounded-2xl
          bg-[#0d1630] border border-white/[0.12] shadow-2xl
          text-white font-[family-name:var(--font-archivo)]
        "
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#111d3f]/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e3b341]/15 text-[#e3b341] border border-[#e3b341]/30">
              <UsersRoundIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold font-[family-name:var(--font-anton)] uppercase tracking-wide">
                Ficha de Colaborador
              </h2>
              <p className="text-xs text-slate-400">
                Edición de información laboral y de contacto (RF-ADM-C12).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Nombre y Cargo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl bg-[#09132b] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#e3b341]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cargo / Puesto de Trabajo
              </label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ej. Cajero Principal, Bodeguero"
                className="w-full h-10 px-3 rounded-xl bg-[#09132b] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#e3b341]"
              />
            </div>
          </div>

          {/* Teléfono y Dirección */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej. +57 300 123 4567"
                className="w-full h-10 px-3 rounded-xl bg-[#09132b] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#e3b341]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Dirección Residencial
              </label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Ej. Carrera 15 # 45-20"
                className="w-full h-10 px-3 rounded-xl bg-[#09132b] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#e3b341]"
              />
            </div>
          </div>

          {/* Estado de Contratación */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-white">Estado Laboral</p>
              <p className="text-[11px] text-slate-400">
                Determina si el colaborador está activo en la sucursal.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? 'bg-[#10b981]' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isActive ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs rounded-xl border border-white/20 text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <Button3D
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="font-bold uppercase text-xs"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button3D>
          </div>
        </form>
      </div>
    </div>
  );
}
