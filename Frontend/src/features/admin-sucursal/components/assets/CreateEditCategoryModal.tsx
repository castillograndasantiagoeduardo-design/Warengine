'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { CategoriaActivoSede, CrearCategoriaActivoDTO, EditarCategoriaActivoDTO } from '../../types/branch-assets.types';

interface CreateEditCategoryModalProps {
  open: boolean;
  categoria?: CategoriaActivoSede | null;
  onClose: () => void;
  onSubmit: (datos: CrearCategoriaActivoDTO | EditarCategoriaActivoDTO) => Promise<any>;
}

export function CreateEditCategoryModal({
  open,
  categoria,
  onClose,
  onSubmit,
}: CreateEditCategoryModalProps) {
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esEdicion = Boolean(categoria);

  useEffect(() => {
    if (!open) return;
    setNombre(categoria?.nombre || '');
    setError(null);
  }, [open, categoria]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre de la categoría es obligatorio.');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await onSubmit({ nombre: nombre.trim() });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar la categoría.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={esEdicion ? 'Editar Categoría de Activos' : 'Nueva Categoría de Activos'}
      description={
        esEdicion
          ? `Actualiza el nombre de la familia "${categoria?.nombre}".`
          : 'Define una nueva familia para clasificar y organizar los bienes de la sucursal.'
      }
      size="sm"
      locked={guardando}
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={guardando}
            className="px-4 py-2 text-xs font-semibold text-neutral-900 bg-white hover:bg-neutral-200 active:scale-[0.98] rounded-xl transition-all shadow-sm"
          >
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear categoría'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            Nombre de la categoría *
          </label>
          <input
            type="text"
            required
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Cómputo y Periféricos, Mobiliario de Oficina..."
            className="w-full px-3 py-2 bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-white/30"
          />
        </div>
      </form>
    </Modal>
  );
}
