'use client';

import React, { useState } from 'react';

interface PanelTopbarProps {
  title?: string;
  subtitle?: string;
  selectedBranch?: string;
  onBranchChange?: (branch: string) => void;
}

export function PanelTopbar({
  title = 'Panel de Control',
  subtitle = 'Visión Global Consolidada de la Cadena Comercial',
  selectedBranch = 'all',
  onBranchChange,
}: PanelTopbarProps) {
  const [currentBranch, setCurrentBranch] = useState(selectedBranch);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const branches = [
    { id: 'all', name: '🌐 Todas las Sucursales (Global)' },
    { id: '1', name: '🏢 Sede Principal (Central #1)' },
    { id: '2', name: '📍 Sucursal Norte - Distribución' },
    { id: '3', name: '📍 Sucursal Occidente - POS Retail' },
  ];

  const handleBranchSelect = (id: string) => {
    setCurrentBranch(id);
    onBranchChange?.(id);
  };

  return (
    <header className="h-18 px-6 bg-[#0c142b]/80 border-b border-white/10 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md select-none">
      {/* Título y Breadcrumb */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-xs text-white/50 font-[family-name:var(--font-archivo)]">
          <span className="text-[#e3b341]">Warengine</span>
          <span>/</span>
          <span className="text-white/80 capitalize">{title}</span>
        </div>
        <h1 className="text-lg xl:text-xl font-bold text-white font-[family-name:var(--font-archivo)] tracking-tight">
          {title}
        </h1>
      </div>

      {/* Acciones y Selectores */}
      <div className="flex items-center gap-4">
        {/* Selector de Sucursal Global */}
        <div className="relative">
          <select
            value={currentBranch}
            onChange={(e) => handleBranchSelect(e.target.value)}
            className="appearance-none bg-[#121c3b] hover:bg-[#16244c] text-white text-xs font-semibold px-4 py-2.5 pr-9 rounded-xl border border-white/15 focus:outline-none focus:border-[#e3b341] transition-all cursor-pointer font-[family-name:var(--font-archivo)] shadow-inner"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id} className="bg-[#0e1630] text-white">
                {b.name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/60">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Indicador de Estado del Sistema */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium font-[family-name:var(--font-pixelify)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>BD EN LÍNEA · LATENCIA 24ms</span>
        </div>

        {/* Campana de Notificaciones de Alertas Administrativas y Stock */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Centro de Alertas"
            aria-label="Alertas del sistema"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {/* Badge de Alerta Activa */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[9px] font-bold text-white items-center justify-center font-[family-name:var(--font-pixelify)]">
                3
              </span>
            </span>
          </button>

          {/* Menú desplegable de Alertas */}
          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0f1838] border border-white/15 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-sm font-bold text-white font-[family-name:var(--font-archivo)]">
                  Alertas Administrativas
                </span>
                <span className="text-[10px] text-[#e3b341] font-[family-name:var(--font-pixelify)] uppercase">
                  3 Urgentes
                </span>
              </div>
              <div className="divide-y divide-white/5 max-h-72 overflow-y-auto mt-2">
                <div className="py-2.5 flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-rose-300">Agotamiento de Stock</p>
                    <p className="text-white/70 text-[11px]">SKU-1082 (Martillo Neumático) en 0 unidades en Sede Norte.</p>
                    <span className="text-[10px] text-white/40 mt-1 block">Hace 12 min</span>
                  </div>
                </div>
                <div className="py-2.5 flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-amber-300">Cierre de Turno con Diferencia</p>
                    <p className="text-white/70 text-[11px]">Caja #2 en Sucursal Central reportó diferencia de -$15.000.</p>
                    <span className="text-[10px] text-white/40 mt-1 block">Hace 45 min</span>
                  </div>
                </div>
                <div className="py-2.5 flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-blue-300">Intento de Acceso No Autorizado</p>
                    <p className="text-white/70 text-[11px]">3 intentos fallidos de login bloqueados por política de seguridad.</p>
                    <span className="text-[10px] text-white/40 mt-1 block">Hace 2 horas</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
