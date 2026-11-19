'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { branchInventoryService } from '../../api/branch-inventory.service';
import type { CategoriaInventario } from '../../types/branch-inventory.types';

interface EditCategoryModalProps {
  open: boolean;
  categoria: CategoriaInventario | null;
  onClose: () => void;
  onGuardado: () => void;
}

export function EditCategoryModal({
  open,
  categoria,
  onClose,
  onGuardado,
}: EditCategoryModalProps) {
  const [nombre, setNombre] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open && categoria) {
      setNombre(categoria.nombre);
      setErrorMsg(null);
    }
  }, [open, categoria]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoria) return;

    const limpio = nombre.trim();
    if (!limpio) {
      setErrorMsg('El nombre de la categoría es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await branchInventoryService.editarCategoria(categoria.id, {
        nombre: limpio,
      });
      onGuardado();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al actualizar categoría.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar categoría"
      description={categoria ? `Categoría #${categoria.id}` : undefined}
      size="md"
      locked={isSubmitting}
      footer={
        <div className="flex gap-2 justify-end w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer shadow-lg shadow-rose-500/20"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5">
            Nombre de la categoría *
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
            required
            autoFocus
          />
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}
      </form>
    </Modal>
  );
}
