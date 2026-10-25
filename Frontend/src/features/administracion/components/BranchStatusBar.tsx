'use client';

/**
 * BranchStatusBar.tsx — Barra de pie de página para telemetría y estado de sincronización.
 *
 * Principio SOLID: Single Responsibility (SRP).
 * Muestra el estado de conexión en tiempo real, marca temporal de sincronización
 * y firma de plataforma extraída del pie del diseño en Figma (nodo 0:1).
 */

import React from 'react';

interface BranchStatusBarProps {
  ultimaSincronizacion?: string;
  isOnline?: boolean;
  className?: string;
}

export function BranchStatusBar({
  ultimaSincronizacion = '17:42:08',
  isOnline = true,
  className = '',
}: BranchStatusBarProps) {
  return (
    <footer
      className={`
        flex flex-wrap items-center justify-between gap-3 px-6 py-3
        border-t border-white/[0.06] bg-[#09132b]/40 text-[11px] text-slate-500
        font-[family-name:var(--font-archivo)] select-none
        ${className}
      `}
    >
      {/* 1. Estado de Conexión y Telemetría */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          {isOnline && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-75" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              isOnline ? 'bg-[#10b981]' : 'bg-red-500'
            }`}
          />
        </span>
        <span className="text-slate-400 font-medium">
          {isOnline ? 'Todos los sistemas operativos' : 'Conexión intermitente'}
        </span>
        <span className="text-slate-600">&bull;</span>
        <span className="font-mono text-slate-500">
          Última sincronización: {ultimaSincronizacion}
        </span>
      </div>

      {/* 2. Firma Corporativa WarEngine */}
      <div className="tracking-widest uppercase font-mono text-[10px] text-slate-600">
        WARENGINE / CONTROL DE OPERACIONES
      </div>
    </footer>
  );
}
