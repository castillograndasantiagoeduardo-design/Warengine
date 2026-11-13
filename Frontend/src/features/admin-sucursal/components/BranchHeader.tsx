'use client';

/**
 * BranchHeader.tsx / BarraSuperior.tsx — Barra superior flotante con Glassmorphism Ejecutivo (.vidrio-fuerte).
 *
 * Incluye:
 * - Izquierda: Cápsula de sucursal activa + badge 'En línea', y buscador rápido con atajo ⌘ K.
 * - Derecha: Selector de período (Hoy | 7D | 30D | 1A), SelectorPaleta (Apariencia),
 *   botón rápido de modo Oscuro/Claro (Sun/Moon) y botón de perfil de usuario.
 */

import React, { useState, useEffect } from 'react';
import { Search, Sun, Moon, Building2, User } from 'lucide-react';
import { useAuth } from '@/features/autenticacion';
import { SelectorPaleta } from './SelectorPaleta';
import { Insignia } from './Insignia';
import type { DashboardPeriodo } from '../types/branch-dashboard.types';

export interface BranchHeaderProps {
  periodo?: DashboardPeriodo;
  onPeriodoChange?: (periodo: DashboardPeriodo) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  sucursalNombre?: string;
  onOpenProfile?: () => void;
  className?: string;
}

const PERIODOS: Array<{ id: DashboardPeriodo; label: string }> = [
  { id: 'hoy', label: 'Hoy' },
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
];

export function BranchHeader({
  periodo = 'hoy',
  onPeriodoChange,
  searchTerm = '',
  onSearchChange,
  sucursalNombre = 'Sucursal Activa',
  onOpenProfile,
  className = '',
}: BranchHeaderProps) {
  const { usuario } = useAuth();
  const [modo, setModo] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = (localStorage.getItem('warengine-tema') as 'dark' | 'light') || 'dark';
    setModo(m);
  }, []);

  const alternarModo = () => {
    const nuevo = modo === 'dark' ? 'light' : 'dark';
    setModo(nuevo);
    const d = document.documentElement;
    if (nuevo === 'light') {
      d.classList.add('light');
      d.classList.remove('dark');
    } else {
      d.classList.add('dark');
      d.classList.remove('light');
    }
    localStorage.setItem('warengine-tema', nuevo);
  };

  // Cálculo de nombre e iniciales del usuario para la cápsula ejecutiva
  const email = usuario?.email || '';
  const emailPrefix = email ? email.split('@')[0] : '';
  const partesNombre = emailPrefix.includes('.') ? emailPrefix.split('.') : [emailPrefix];
  const nombreUsuario =
    usuario?.nombre ||
    (partesNombre.length > 1
      ? `${partesNombre[0].charAt(0).toUpperCase() + partesNombre[0].slice(1)} ${
          partesNombre[1].charAt(0).toUpperCase() + partesNombre[1].slice(1)
        }`
      : emailPrefix
      ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
      : 'Carlos Restrepo');

  const iniciales = (
    usuario?.nombre
      ? usuario.nombre
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
      : partesNombre.length > 1
      ? (partesNombre[0][0] + partesNombre[1][0])
      : nombreUsuario.slice(0, 2)
  ).toUpperCase() || 'CR';

  return (
    <header className={`sticky top-4 z-30 w-full overflow-visible ${className}`}>
      <div className="vidrio-fuerte px-4 sm:px-5 py-2.5 flex items-center justify-between gap-4 overflow-visible">
        {/* Lado Izquierdo: Cápsula de Sucursal + Buscador Rápido */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          {/* Cápsula de Sucursal Activa */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl superficie-control shrink-0">
            <Building2 className="w-3.5 h-3.5 text-brand-500" />
            <span className="font-sans font-medium text-xs text-text truncate max-w-[130px] sm:max-w-[180px]">
              {sucursalNombre}
            </span>
            <Insignia variante="success" conPunto tamano="sm" className="hidden sm:inline-flex">
              En línea
            </Insignia>
          </div>

          {/* Buscador Rápido */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Buscar factura, cliente, producto..."
              className="superficie-control rounded-xl pl-8 pr-12 py-1.5 text-xs w-full focus:outline-none placeholder-text-muted"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-text-muted px-1 rounded bg-white/[0.04] border border-border hidden sm:inline">
              ⌘ K
            </span>
          </div>
        </div>

        {/* Lado Derecho: Rango de Fechas + SelectorPaleta + Toggle Tema + Cápsula Perfil */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Selector de Período (Hoy | 7D | 30D) */}
          <div className="hidden md:flex items-center p-1 rounded-xl superficie-control text-xs">
            {PERIODOS.map((p) => {
              const isActive = periodo === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPeriodoChange?.(p.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-600 text-btn-primario-texto shadow-sm'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Panel SelectorPaleta (Apariencia del Dashboard) */}
          <SelectorPaleta />

          {/* Botón Rápido Modo Oscuro / Claro */}
          <button
            type="button"
            onClick={alternarModo}
            className="superficie-control rounded-xl p-2 text-text-muted hover:text-text transition-colors cursor-pointer"
            title={modo === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Cambiar tema de color"
          >
            {modo === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-brand-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-brand-500" />
            )}
          </button>

          {/* Cápsula de Perfil de Usuario Ejecutiva (Imagen 1) */}
          <div
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-xl superficie-control cursor-pointer hover:border-brand-400/30 transition-colors shrink-0"
            title="Mi perfil de administrador"
            role="button"
            tabIndex={0}
          >
            <div className="w-7 h-7 rounded-lg bg-brand-600 text-btn-primario-texto flex items-center justify-center font-titulos font-semibold text-xs shadow-sm">
              {iniciales}
            </div>
            <div className="text-left hidden lg:block leading-tight">
              <div className="text-xs font-semibold text-text truncate max-w-[130px]">
                {nombreUsuario}
              </div>
              <div className="text-[10px] text-text-muted truncate max-w-[130px]">
                {sucursalNombre}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export const BarraSuperior = BranchHeader;
