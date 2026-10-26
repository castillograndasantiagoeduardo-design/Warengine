'use client';

/**
 * EditSupplierModal.tsx — Modal para modificar datos comerciales de un proveedor.
 * 
 * Principio SOLID: Single Responsibility Principle (SRP).
 */

import React, { useState, useEffect } from 'react';
import { Button3D } from '@/components/ui/Button3D';
import type { ProveedorInventario } from '../types/branch-inventory.types';

interface EditSupplierModalProps {
  isOpen: boolean;
  proveedor: ProveedorInventario | null;
  onClose: () => void;
  onGuardar: (id: number, data: { nombre: string; contacto?: string; isActive: boolean }) => Promise<{ ok: boolean; error?: string }>;
}

export function EditSupplierModal({
  isOpen,
  proveedor,
  onClose,
  onGuardar,
}: EditSupplierModalProps) {
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (proveedor) {
      setNombre(proveedor.nombre || '');
      setContacto(proveedor.contacto || '');
      setIsActive(proveedor.isActive);
      setErrorMsg(null);
    }
  }, [proveedor]);

  if (!isOpen || !proveedor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombre.trim()) {
      setErrorMsg('El nombre comercial del proveedor es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onGuardar(proveedor.id, {
        nombre: nombre.trim(),
        contacto: contacto.trim() || undefined,
        isActive,
      });

      if (res.ok) {
        onClose();
      } else {
        setErrorMsg(res.error || 'No fue posible actualizar el proveedor.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al guardar.');
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
              Editar Proveedor
            </h3>
            <p className="text-[11px] text-slate-400">
              Modificar datos de contacto y estado operativo
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

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Nombre de la Empresa o Razón Social *
            </label>
            <input
              type="text"
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
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              placeholder="Ej. ventas@empresa.com / Tel: 300 123 4567"
              className="w-full h-9 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white focus:outline-none focus:border-[#e3b341]/60 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Estado Operativo
            </label>
            <div className="flex items-center gap-3">
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
              <span className="text-xs text-slate-300">
                {isActive ? 'Proveedor Habilitado' : 'Proveedor Suspendido / Inactivo'}
              </span>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 px-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors text-xs font-[family-name:var(--font-ui)] uppercase cursor-pointer"
            >
              Cancelar
            </button>

            <Button3D
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="flex-1 justify-center text-center font-bold"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button3D>
          </div>
        </form>
      </div>
    </div>
  );
}
