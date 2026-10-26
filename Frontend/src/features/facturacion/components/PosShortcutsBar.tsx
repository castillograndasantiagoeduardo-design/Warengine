'use client';

/**
 * PosShortcutsBar.tsx — Barra inferior de referencia de atajos de teclado para el cajero.
 */

import React from 'react';

export function PosShortcutsBar() {
  const shortcuts = [
    { key: 'F2', action: 'Buscar Producto / Escanear' },
    { key: 'F4', action: 'Cobrar Orden' },
    { key: 'F8', action: 'Historial de Comprobantes' },
    { key: 'F9', action: 'Alertar Administrador' },
    { key: 'ESC', action: 'Cerrar / Cancelar' },
  ];

  return (
    <footer className="h-9 px-4 bg-[#0a1124] border-t border-white/5 flex items-center justify-between text-[11px] text-white/50 select-none">
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
        {shortcuts.map((sc) => (
          <div key={sc.key} className="flex items-center gap-1.5 whitespace-nowrap">
            <kbd className="px-1.5 py-0.5 rounded bg-[#14213D] border border-white/10 text-white font-[family-name:var(--font-ui)] text-[10px] font-bold shadow-xs">
              {sc.key}
            </kbd>
            <span className="text-white/60">{sc.action}</span>
          </div>
        ))}
      </div>

      <div className="hidden md:flex items-center gap-2 text-[10px] text-white/40 font-mono">
        <span>WarEngine Terminal v2.0</span>
        <span>·</span>
        <span className="text-emerald-400">En Línea</span>
      </div>
    </footer>
  );
}
