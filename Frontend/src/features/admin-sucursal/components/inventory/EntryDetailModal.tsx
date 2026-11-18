'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import type { EntradaMercanciaItem } from '../../types/branch-inventory.types';

interface EntryDetailModalProps {
  open: boolean;
  entrada: EntradaMercanciaItem | null;
  onClose: () => void;
  onAnular?: (entrada: EntradaMercanciaItem) => void;
}

export function EntryDetailModal({
  open,
  entrada,
  onClose,
  onAnular,
}: EntryDetailModalProps) {
  if (!entrada) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle de entrada de mercancía"
      description={`Comprobante de ingreso #${entrada.id}`}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          {onAnular && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onAnular(entrada);
              }}
              className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold cursor-pointer border border-red-500/20"
            >
              Anular esta entrada
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer ml-auto"
          >
            Cerrar
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Info general */}
        <div className="vidrio rounded-xl p-4 grid grid-cols-2 gap-3">
          <div>
            <span className="text-white/40 block">Fecha de ingreso</span>
            <span className="text-white font-medium">
              {new Date(entrada.fecha).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-white/40 block">Registrado por</span>
            <span className="text-white font-medium">
              {entrada.usuarioNombre || `Usuario #${entrada.usuarioId || 'N/A'}`}
            </span>
          </div>
          <div>
            <span className="text-white/40 block">Proveedor</span>
            <span className="text-white font-medium">
              {entrada.proveedorNombre || (entrada.proveedorId ? `Proveedor #${entrada.proveedorId}` : 'No asignado')}
            </span>
          </div>
          <div>
            <span className="text-white/40 block">Sede</span>
            <span className="text-white font-medium">
              {entrada.sucursalNombre || `Sede #${entrada.sucursalId}`}
            </span>
          </div>
        </div>

        {/* Producto y cantidad */}
        <div className="vidrio rounded-xl p-4 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            Mercancía asentada
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <div className="font-semibold text-white text-sm">
                {entrada.productoNombre}
              </div>
              <div className="font-mono text-white/40 text-[11px]">
                SKU: {entrada.productoSku}
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-lg font-bold text-emerald-400">
                +{entrada.cantidad}
              </span>
              <div className="text-[10px] text-white/40">unidades</div>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-white/40 block">Motivo / Documento</span>
            <p className="text-white/80 mt-0.5">
              {entrada.motivo || 'Ingreso regular por reposición de inventario.'}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
