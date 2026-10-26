'use client';

/**
 * CreateCategoryModal.tsx — Modal para registrar una nueva categoría de productos.
 * 
 * Principio SOLID: Single Responsibility (SRP).
 * Facilita el alta rápida de categorías comerciales (RF-ADM-B5)
 * para clasificar productos y habilitar los filtros del cajero en el POS.
 */

import React, { useState } from 'react';
import { Button3D } from '@/components/ui/Button3D';
import { TagIcon } from './Icons';
import type { CategoriaInventario } from '../types/branch-inventory.types';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriaCreada: (categoria: CategoriaInventario) => void;
  crearCategoriaFn: (nombre: string) => Promise<{ ok: boolean; data?: CategoriaInventario; error?: string }>;
}

export function CreateCategoryModal({
  isOpen,
  onClose,
  onCategoriaCreada,
  crearCategoriaFn,
}: CreateCategoryModalProps) {
  const [nombre, setNombre] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const limpio = nombre.trim();
    if (!limpio) {
      setErrorMsg('El nombre de la categoría es obligatorio.');
      return;
    }

    if (limpio.length > 100) {
      setErrorMsg('El nombre no puede exceder 100 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await crearCategoriaFn(limpio);
      if (res.ok && res.data) {
        onCategoriaCreada(res.data);
        setNombre('');
        onClose();
      } else {
        setErrorMsg(res.error || 'No fue posible crear la categoría.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al crear la categoría.');
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
        {/* Luz difusa superior dorada */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#e3b341]/50 to-transparent" />

        {/* Encabezado */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e3b341]/10 border border-[#e3b341]/25 text-[#e3b341]">
              <TagIcon size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-[family-name:var(--font-anton)] uppercase tracking-wider">
                Nueva Categoría
              </h3>
              <p className="text-[11px] text-slate-400">
                Clasificación de productos y filtro de mostrador
              </p>
            </div>
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
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              placeholder="Ej. Bebidas, Snacks, Ferretería, Iluminación..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={100}
              className="w-full h-9 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white focus:outline-none focus:border-[#e3b341]/60 text-xs placeholder:text-slate-500"
              autoFocus
              required
            />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400 leading-relaxed">
            💡 <strong className="text-slate-300">Uso en el sistema:</strong> Esta categoría estará disponible de inmediato para asignar artículos sueltos y habilitará el filtro de pestañas rápidas para el cajero en el Punto de Venta (POS).
          </div>

          <div className="flex gap-2.5 pt-2">
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
              className="flex-1 font-bold font-[family-name:var(--font-ui)] uppercase text-xs h-9 cursor-pointer"
            >
              {isSubmitting ? 'Creando...' : 'Crear Categoría'}
            </Button3D>
          </div>
        </form>
      </div>
    </div>
  );
}
