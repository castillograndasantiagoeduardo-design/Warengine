'use client';

/**
 * EditSupplierModal.tsx — Modal para actualizar datos de un proveedor.
 * Migrado a Modal.tsx para accesibilidad y diseño unificado.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { ProveedorInventario } from '../types/branch-inventory.types';

interface EditSupplierModalProps {
  isOpen: boolean;
  proveedor: ProveedorInventario | null;
  onClose: () => void;
  onProveedorActualizado: (proveedor: ProveedorInventario) => void;
  actualizarProveedorFn: (
    id: number,
    data: { nombre?: string; contacto?: string; isActive?: boolean },
  ) => Promise<{ ok: boolean; error?: string }>;
}

export function EditSupplierModal({
  isOpen,
  proveedor,
  onClose,
  onProveedorActualizado,
  actualizarProveedorFn,
}: EditSupplierModalProps) {
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && proveedor) {
      setNombre(proveedor.nombre);
      setContacto(proveedor.contacto || '');
      setIsActive(proveedor.isActive ?? true);
      setErrorMsg(null);
    }
  }, [isOpen, proveedor]);

  if (!proveedor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const limpio = nombre.trim();
    if (!limpio) {
      setErrorMsg('El nombre comercial del proveedor es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await actualizarProveedorFn(proveedor.id, {
        nombre: limpio,
        contacto: contacto.trim() || undefined,
        isActive,
      });

      if (res.ok) {
        onProveedorActualizado({
          ...proveedor,
          nombre: limpio,
          contacto: contacto.trim() || undefined,
          isActive,
        });
        onClose();
      } else {
        setErrorMsg(res.error || 'No fue posible actualizar el proveedor.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al actualizar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Editar Proveedor"
      description={`Proveedor #${proveedor.id}`}
      size="md"
      locked={isSubmitting}
      footer={
        <div className="flex gap-2 justify-end w-full">
          <button
            type="button"
            onClick={onClose}
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
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
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
            Razón Social / Nombre Comercial *
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1">
            Datos de contacto
          </label>
          <input
            type="text"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="pt-2 border-t border-white/5">
          <label className="block text-xs font-semibold text-white/70 mb-2">
            Estado comercial
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-xs text-white/70">
              {isActive ? 'Activo (disponible para compras)' : 'Inactivo'}
            </span>
          </div>
        </div>
      </form>
    </Modal>
  );
}
