'use client';

/**
 * BranchSidebar.tsx — Sidebar flotante con Glassmorphism Ejecutivo (.vidrio-fuerte).
 *
 * Implementación oficial idéntica al proyecto de prueba (localhost:3005):
 * 1. Expandido (w-64):
 *    - Encabezado: Logo "W", texto "WarEngine" y "Admin. de sucursal", botón PanelLeftClose a la derecha (ml-auto).
 *    - Navegación: Categorías MENÚ, OPERACIONES, SISTEMA con gap uniforme y estilo translúcido.
 *    - Pie: Perfil de usuario y botón Cerrar sesión.
 * 2. Colapsado (w-20):
 *    - Encabezado: Logo "W" centrado.
 *    - Navegación: Íconos centrados w-11 h-11 con separadores horizontales (w-6 h-px bg-border).
 *    - Pie: Avatar de usuario, botón Cerrar sesión y al final botón PanelLeftOpen para volver a expandir.
 */

import React, { useState } from 'react';
import { useAuth } from '@/features/autenticacion';
import {
  LayoutDashboard,
  Package,
  Receipt,
  UsersRound,
  Wrench,
  BarChart3,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export type BranchSection =
  | 'resumen'
  | 'facturacion'
  | 'inventario'
  | 'clientes'
  | 'personal'
  | 'activos'
  | 'reportes'
  | 'configuracion'
  | 'movimientos'
  | 'proveedores'
  | 'cajeros';

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
  { id: 'resumen', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
  { id: 'facturacion', label: 'Facturación', icon: <Receipt className="w-4 h-4 shrink-0" /> },
  { id: 'inventario', label: 'Inventario', icon: <Package className="w-4 h-4 shrink-0" /> },
  { id: 'clientes', label: 'Clientes', icon: <UsersRound className="w-4 h-4 shrink-0" /> },
];

const OPERACIONES_ITEMS: NavItem[] = [
  { id: 'personal', label: 'Personal', icon: <UsersRound className="w-4 h-4 shrink-0" /> },
  { id: 'activos', label: 'Activos', icon: <Wrench className="w-4 h-4 shrink-0" /> },
  { id: 'reportes', label: 'Reportes', icon: <BarChart3 className="w-4 h-4 shrink-0" /> },
];

const SISTEMA_ITEMS: NavItem[] = [
  { id: 'configuracion', label: 'Configuración', icon: <Settings className="w-4 h-4 shrink-0" /> },
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
          flex items-center transition-all duration-150 cursor-pointer rounded-xl
          ${
            colapsado
              ? 'p-2.5 justify-center w-11 h-11'
              : 'w-full px-3 py-2 text-left gap-3 text-xs font-sans font-medium'
          }
          ${
            isActive
              ? 'bg-brand-600/15 dark:bg-brand-500/18 border border-brand-600/30 dark:border-brand-400/40 text-brand-700 dark:text-slate-100 font-semibold shadow-sm'
              : 'border border-transparent text-text-muted font-normal hover:text-text hover:bg-slate-900/5 dark:hover:bg-white/6'
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
        transition-all duration-300 select-none overflow-hidden shrink-0
        ${colapsado ? 'w-20' : 'w-64'}
        ${className}
      `}
      aria-label="Barra lateral de navegación"
    >
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* 1. Header con Logo Oficial y botón Colapsar a la derecha */}
        <div
          className={`h-16 px-4 flex items-center border-b border-border shrink-0 ${
            colapsado ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo "W" en cuadrado brand-600 redondeado */}
            <div
              className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-btn-primario-texto font-sans font-semibold text-sm shrink-0 shadow-sm shadow-brand-600/30 transition-colors duration-300"
              title="WarEngine — Admin. de sucursal"
              aria-label="Logo de WarEngine"
            >
              W
            </div>

            {!colapsado && (
              <div className="min-w-0">
                <span className="font-titulos font-semibold text-sm tracking-normal text-text block leading-tight">
                  WarEngine
                </span>
                <span className="font-sans text-xs font-medium text-text-muted block leading-tight mt-0.5 whitespace-nowrap">
                  Admin. de sucursal
                </span>
              </div>
            )}
          </div>

          {!colapsado && (
            <button
              type="button"
              onClick={() => setColapsado(true)}
              className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-slate-900/5 dark:hover:bg-white/8 transition-colors shrink-0 cursor-pointer ml-auto"
              title="Colapsar barra lateral"
              aria-label="Colapsar barra lateral"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2. Navegación por Secciones */}
        <nav
          className={`p-3 space-y-5 flex-1 ${colapsado ? 'flex flex-col items-center' : ''}`}
          aria-label="Navegación principal"
        >
          {/* SECCIÓN 1: MENÚ */}
          <div className={`space-y-1.5 ${colapsado ? 'w-full flex flex-col items-center' : ''}`}>
            {!colapsado ? (
              <p className="px-3 text-xs font-sans font-medium uppercase tracking-wide text-text-muted">
                MENÚ
              </p>
            ) : (
              <div className="w-6 h-px bg-border my-1" aria-hidden="true" />
            )}
            <div className={`space-y-1 ${colapsado ? 'w-full flex flex-col items-center' : ''}`}>
              {MENU_ITEMS.map(renderItem)}
            </div>
          </div>

          {/* SECCIÓN 2: OPERACIONES */}
          <div className={`space-y-1.5 ${colapsado ? 'w-full flex flex-col items-center' : ''}`}>
            {!colapsado ? (
              <p className="px-3 text-xs font-sans font-medium uppercase tracking-wide text-text-muted">
                OPERACIONES
              </p>
            ) : (
              <div className="w-6 h-px bg-border my-1" aria-hidden="true" />
            )}
            <div className={`space-y-1 ${colapsado ? 'w-full flex flex-col items-center' : ''}`}>
              {OPERACIONES_ITEMS.map(renderItem)}
            </div>
          </div>

          {/* SECCIÓN 3: SISTEMA */}
          <div className={`space-y-1.5 ${colapsado ? 'w-full flex flex-col items-center' : ''}`}>
            {!colapsado ? (
              <p className="px-3 text-xs font-sans font-medium uppercase tracking-wide text-text-muted">
                SISTEMA
              </p>
            ) : (
              <div className="w-6 h-px bg-border my-1" aria-hidden="true" />
            )}
            <div className={`space-y-1 ${colapsado ? 'w-full flex flex-col items-center' : ''}`}>
              {SISTEMA_ITEMS.map(renderItem)}
            </div>
          </div>
        </nav>
      </div>

      {/* 3. Pie del Sidebar */}
      <div className="p-3 border-t border-border shrink-0 space-y-1">
        {/* Perfil del Administrador */}
        <button
          type="button"
          onClick={onOpenProfile}
          title={colapsado ? userDisplayName : undefined}
          className={`
            w-full flex items-center rounded-xl p-2 transition-colors cursor-pointer
            ${colapsado ? 'justify-center' : 'gap-2.5 text-left'}
            hover:bg-slate-900/5 dark:hover:bg-white/6
          `}
        >
          <div className="w-8 h-8 rounded-lg superficie-control text-xs font-semibold text-text flex items-center justify-center shrink-0">
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

        {/* Cerrar sesión */}
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

        {/* Botón para expandir al final cuando está colapsado */}
        {colapsado && (
          <button
            type="button"
            onClick={() => setColapsado(false)}
            className="w-full flex items-center justify-center p-2.5 rounded-xl text-text-muted hover:text-text hover:bg-slate-900/5 dark:hover:bg-white/8 transition-colors cursor-pointer pt-2 border-t border-border/50"
            title="Expandir barra lateral"
            aria-label="Expandir barra lateral"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
