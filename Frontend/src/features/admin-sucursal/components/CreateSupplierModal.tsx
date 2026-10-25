'use client';

/**
 * CreateSupplierModal.tsx — Modal para registrar un nuevo proveedor comercial.
 * 
 * Principio SOLID: Single Responsibility (SRP).
 * Facilita el alta rápida de un proveedor comercial (RF-ADM-B6)
 * para asociarlo a compras, entradas de mercancía o productos de la sede.
 */

import React, { useState } from 'react';
import { Button3D } from '@/components/ui/Button3D';
import type { CrearProveedorDTO, ProveedorInventario } from '../types/branch-inventory.types';

interface CreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProveedorCreado: (proveedor: ProveedorInventario) => void;
  crearProveedorFn: (data: CrearProveedorDTO) => Promise<{ ok: boolean; data?: ProveedorInventario; error?: string }>;
}

export function CreateSupplierModal({
  isOpen,
  onClose,
  onProveedorCreado,
  crearProveedorFn,
}: CreateSupplierModalProps) {
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombre.trim()) {
      setErrorMsg('El nombre comercial del proveedor es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await crearProveedorFn({
        nombre: nombre.trim(),
        contacto: contacto.trim() || undefined,
      });

      if (res.ok && res.data) {
        onProveedorCreado(res.data);
        setNombre('');
        setContacto('');
        onClose();
      } else {
        setErrorMsg(res.error || 'No fue posible registrar el proveedor.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al crear proveedor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-[#0d1630] border border-white/[0.12] p-5 shadow-2xl text-slate-100 font-[family-name:var(--font-archivo)]">
        {/* Luz difusa superior */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#e3b341]/40 to-transparent" />

        {/* Encabezado */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
          <div>
            <h3 className="text-base font-bold text-white font-[family-name:var(--font-anton)] uppercase tracking-wider">
              Nuevo Proveedor
            </h3>
            <p className="text-[11px] text-slate-400">
              Registrar distribuidor para abastecimiento de sede
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer text-lg"
          >
            &times;
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 mb-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Nombre de la Empresa o Razón Social *
            </label>
            <input
              type="text"
              placeholder="Ej. Importadora y Ferretería Andina SAS"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white focus:outline-none focus:border-[#e3b341]/60 text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Datos de Contacto (Teléfono, Correo, Asesor)
            </label>
            <input
              type="text"
              placeholder="Ej. contacto@andina.com / Tel: 310 987 6543"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white focus:outline-none focus:border-[#e3b341]/60 text-xs"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 px-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors text-xs font-[family-name:var(--font-pixelify)] uppercase cursor-pointer"
            >
              Cancelar
            </button>

            <Button3D
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="flex-1 justify-center text-center font-bold"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Proveedor'}
            </Button3D>
          </div>
        </form>
      </div>
    </div>
  );
}
