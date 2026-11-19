'use client';

/**
 * CreateCategoryModal.tsx — Modal para registrar una nueva categoría de productos.
 * Migrado a Modal.tsx para accesibilidad y diseño unificado.
 */

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { CategoriaInventario } from '../types/branch-inventory.types';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriaCreada: (categoria: CategoriaInventario) => void;
  crearCategoriaFn: (nombre: string, descripcion?: string) => Promise<{ ok: boolean; data?: CategoriaInventario; error?: string }>;
}

export function CreateCategoryModal({
  isOpen,
  onClose,
  onCategoriaCreada,
  crearCategoriaFn,
}: CreateCategoryModalProps) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setNombre('');
    setDescripcion('');
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
      const res = await crearCategoriaFn(limpio, descripcion.trim() || undefined);
      if (res.ok && res.data) {
        onCategoriaCreada(res.data);
        handleClose();
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
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Nueva Categoría"
      description="Clasificación para el catálogo comercial y filtros del POS"
      size="md"
      locked={isSubmitting}
      footer={
        <div className="flex gap-2 justify-end w-full">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !nombre.trim()}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-40 shadow-lg shadow-rose-500/20"
          >
            {isSubmitting ? 'Creando...' : 'Crear Categoría'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1">
            Nombre de la categoría *
          </label>
          <input
            type="text"
            placeholder="Ej. Lácteos, Granos, Ferretería..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1">
            Descripción comercial (opcional)
          </label>
          <textarea
            rows={3}
            placeholder="Breve nota descriptiva para organizar los artículos..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
