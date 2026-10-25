'use client';

import React from 'react';

interface NosotrosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NosotrosModal({ isOpen, onClose }: NosotrosModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-nosotros-title"
    >
      <div className="bg-[#17151c] border border-white/10 rounded-2xl p-8 max-w-lg text-center shadow-2xl">
        <h2
          id="modal-nosotros-title"
          className="font-[family-name:var(--font-anton)] text-3xl text-[var(--gold)] mb-4 uppercase"
        >
          Sobre WarEngine
        </h2>
        <p className="font-[family-name:var(--font-archivo)] font-light text-white/90 leading-relaxed mb-6">
          WarEngine es la plataforma empresarial integral de última generación diseñada para potenciar la gestión multi-sucursal, facturación POS en tiempo real y trazabilidad logística sin límites.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="btn-3d px-6 py-2 text-sm cursor-pointer"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}
