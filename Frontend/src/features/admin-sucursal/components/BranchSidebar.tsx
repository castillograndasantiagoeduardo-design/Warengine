'use client';

/**
 * BranchSidebar.tsx — Sidebar flotante con Glassmorphism Ejecutivo (.vidrio-fuerte).
 *
 * Soporta dos modos:
 * 1. Expandido (w-60): Logo "W", secciones MENÚ, OPERACIONES, SISTEMA y pie con perfil.
 * 2. Colapsado / Dock (w-[68px]): Botones centrados w-11 h-11 con title nativo.
 */

import React, { useState } from 'react';
import { useAuth } from '@/features/autenticacion';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Truck,
  UsersRound,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';

export type BranchSection =
  | 'resumen'
  | 'inventario'
  | 'movimientos'
  | 'proveedores'
  | 'cajeros'
  | 'facturacion'
  | 'reportes'
  | 'configuracion';

interface BranchSidebarProps {
  activeSection?: BranchSection;
  onSelectSection?: (section: BranchSection) => void;
  onOpenProfile?: () => void;
  className?: string;
}

interface NavItem {
  id: BranchSection;
  label: string;
  icon: React.ReactNode;
}

const MENU_ITEMS: NavItem[] = [
  { id: 'resumen', label: 'Resumen', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
  { id: 'inventario', label: 'Inventario & Stock', icon: <Package className="w-4 h-4 shrink-0" /> },
  { id: 'movimientos', label: 'Movimientos Sede', icon: <Boxes className="w-4 h-4 shrink-0" /> },
];

const OPERACIONES_ITEMS: NavItem[] = [
  { id: 'facturacion', label: 'Facturación & POS', icon: <Receipt className="w-4 h-4 shrink-0" /> },
  { id: 'cajeros', label: 'Cajeros & Turnos', icon: <UsersRound className="w-4 h-4 shrink-0" /> },
  { id: 'proveedores', label: 'Proveedores', icon: <Truck className="w-4 h-4 shrink-0" /> },
];

const SISTEMA_ITEMS: NavItem[] = [
  // Dejamos pendientes las secciones restantes del sistema
];

export function BranchSidebar({
  activeSection = 'resumen',
  onSelectSection,
  onOpenProfile,
  className = '',
}: BranchSidebarProps) {
  const { usuario, logout } = useAuth();
  const [colapsado, setColapsado] = useState(false);

  const userInitial = usuario?.email ? usuario.email.charAt(0).toUpperCase() : 'A';
  const userDisplayName = usuario?.email ? usuario.email.split('@')[0] : 'Admin Sede';

  const renderItem = (item: NavItem) => {
    const isActive = activeSection === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelectSection?.(item.id)}
        title={colapsado ? item.label : undefined}
        className={`
          w-full flex items-center transition-all duration-150 cursor-pointer rounded-xl
          ${
            colapsado
              ? 'justify-center w-11 h-11 mx-auto'
              : 'gap-3 px-3 py-2 text-xs font-sans font-medium'
          }
          ${
            isActive
              ? 'bg-brand-600/15 dark:bg-brand-500/18 border border-brand-600/30 dark:border-brand-400/40 text-brand-700 dark:text-slate-100 font-semibold shadow-sm'
              : 'text-text-muted hover:text-text hover:bg-white/[0.04]'
          }
        `}
      >
        <span className={isActive ? 'text-brand-500' : 'text-text-muted'}>
          {item.icon}
        </span>
        {!colapsado && <span className="truncate">{item.label}</span>}
      </button>
    );
  };

  return (
    <aside
      className={`
        vidrio-fuerte h-[calc(100vh-2rem)] rounded-2xl flex flex-col justify-between
        transition-all duration-300 p-3 select-none
        ${colapsado ? 'w-[68px]' : 'w-60'}
        ${className}
      `}
    >
      {/* 1. Header con Logo Oficial y botón Colapsar */}
      <div>
        <div className="flex items-center justify-between gap-2 px-1 py-2 mb-4 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Logo "W" Corporativo */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-btn-primario-texto flex items-center justify-center font-titulos font-semibold text-base shadow-sm shrink-0">
              W
            </div>
            {!colapsado && (
              <div className="min-w-0">
                <div className="font-titulos font-semibold text-sm text-text leading-tight tracking-tight truncate">
                  WarEngine
                </div>
                <div className="text-[10px] font-sans font-medium text-text-muted leading-tight truncate">
                  Admin. de sucursal
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setColapsado(!colapsado)}
            className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-white/[0.04] transition-colors cursor-pointer hidden md:flex"
            title={colapsado ? 'Expandir menú' : 'Colapsar menú'}
            aria-label={colapsado ? 'Expandir menú' : 'Colapsar menú'}
          >
            {colapsado ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* 2. Lista de Navegación por Secciones */}
        <div className="space-y-4">
          {/* SECCIÓN 1: MENÚ */}
          <div>
            {!colapsado && (
              <div className="px-3 text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
                Menú
              </div>
            )}
            <div className="space-y-1">{MENU_ITEMS.map(renderItem)}</div>
          </div>

          {/* SECCIÓN 2: OPERACIONES */}
          <div>
            {!colapsado && (
              <div className="px-3 text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
                Operaciones
              </div>
            )}
            <div className="space-y-1">{OPERACIONES_ITEMS.map(renderItem)}</div>
          </div>
        </div>
      </div>

      {/* 3. Pie con Perfil de Usuario y Logout */}
      <div className="pt-3 border-t border-border space-y-1.5">
        <button
          type="button"
          onClick={onOpenProfile}
          title={colapsado ? userDisplayName : undefined}
          className={`
            w-full flex items-center rounded-xl p-2 transition-colors cursor-pointer
            ${colapsado ? 'justify-center' : 'gap-2.5 text-left'}
            hover:bg-white/[0.04]
          `}
        >
          <div className="w-8 h-8 rounded-lg bg-surface border border-border text-xs font-semibold text-text flex items-center justify-center shrink-0">
            {userInitial}
          </div>
          {!colapsado && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-sans font-medium text-text truncate">
                {userDisplayName}
              </div>
              <div className="text-[10px] font-sans text-text-muted truncate">
                {usuario?.email || 'admin@warengine.local'}
              </div>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => logout()}
          title={colapsado ? 'Cerrar sesión' : undefined}
          className={`
            w-full flex items-center rounded-xl p-2 text-xs font-sans font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer
            ${colapsado ? 'justify-center' : 'gap-2 px-3'}
          `}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!colapsado && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
