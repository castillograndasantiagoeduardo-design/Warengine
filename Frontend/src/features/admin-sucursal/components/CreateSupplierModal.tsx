'use client';

/**
 * CreateSupplierModal.tsx — Modal para registrar un nuevo proveedor comercial.
 * Migrado a Modal.tsx para accesibilidad y diseño unificado.
 */

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
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

  const resetForm = () => {
    setNombre('');
    setContacto('');
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
        handleClose();
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
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Nuevo Proveedor"
      description="Alta de distribuidor o proveedor mayorista"
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
            {isSubmitting ? 'Guardando...' : 'Guardar Proveedor'}
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
            placeholder="Ej. Distribuciones del Valle S.A.S."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1">
            Datos de contacto (Teléfono / Email / Asesor)
          </label>
          <input
            type="text"
            placeholder="Ej. 3101234567 - ventas@valle.com - Juan Gómez"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
          />
        </div>
      </form>
    </Modal>
  );
}
