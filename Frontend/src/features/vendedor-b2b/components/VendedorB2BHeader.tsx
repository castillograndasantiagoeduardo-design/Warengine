'use client';

/**
 * VendedorB2BHeader.tsx — Barra superior flotante con Glassmorphism Ejecutivo (.vidrio-fuerte)
 * para el módulo de Vendedor B2B.
 */

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Menu, Briefcase } from 'lucide-react';
import { useAuth } from '@/features/autenticacion';
import { SelectorPaleta } from '@/components/SelectorPaleta';
import { Insignia } from '@/components/Insignia';

export interface VendedorB2BHeaderProps {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
  className?: string;
  // Props de compatibilidad con llamadas anteriores
  onAbrirHistorial?: () => void;
  onAbrirCotizaciones?: () => void;
  cotizacionesAprobadasCount?: number;
}

export function VendedorB2BHeader({
  onOpenMobileMenu,
  onOpenProfile,
  className = '',
}: VendedorB2BHeaderProps) {
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

  const email = usuario?.email || '';
  const emailPrefix = email ? email.split('@')[0] : '';
  const iniciales = (
    usuario?.nombre
      ? usuario.nombre
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
      : emailPrefix.slice(0, 2)
  ).toUpperCase() || 'VB';
  const rol = usuario?.rolNombre || 'vendedor-b2b';

  return (
    <header className={`sticky top-4 z-30 w-full overflow-visible ${className}`}>
      <div className="vidrio-fuerte px-4 sm:px-5 py-2.5 flex items-center justify-between gap-4 overflow-visible">
        {/* Lado Izquierdo: Botón Menú Móvil + Cápsula "Ventas corporativas" + Insignia "Catálogo multi-bodega" */}
        <div className="flex items-center gap-3 min-w-0">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="md:hidden superficie-control rounded-xl p-2 text-text-muted hover:text-text transition-colors cursor-pointer shrink-0"
              title="Abrir menú de navegación"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl superficie-control shrink-0">
            <Briefcase className="w-3.5 h-3.5 text-brand-500" />
            <span className="font-sans font-medium text-xs text-text">
              Ventas corporativas
            </span>
            <Insignia variante="brand" tamano="sm" className="hidden sm:inline-flex">
              Catálogo multi-bodega
            </Insignia>
          </div>
        </div>

        {/* Lado Derecho: SelectorPaleta + Toggle Tema + Cápsula Perfil */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Selector de Paletas y Apariencia */}
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

          {/* Cápsula de Perfil de Usuario Ejecutiva */}
          <div
            onClick={onOpenProfile}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenProfile?.();
              }
            }}
            className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-xl superficie-control cursor-pointer hover:border-brand-400/30 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 select-none"
            title={email || 'Mi perfil'}
            role={onOpenProfile ? 'button' : undefined}
            tabIndex={onOpenProfile ? 0 : undefined}
          >
            <div className="w-7 h-7 rounded-lg bg-brand-600 text-btn-primario-texto flex items-center justify-center font-titulos font-semibold text-xs shadow-sm">
              {iniciales}
            </div>
            <div className="text-left hidden lg:block leading-tight">
              <div className="text-xs font-semibold text-text truncate max-w-[140px]">
                {email || 'Vendedor'}
              </div>
              <div className="text-[10px] text-text-muted truncate max-w-[140px] capitalize">
                {rol}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
