'use client';

/**
 * VendedorB2BSidebar.tsx — Sidebar flotante con Glassmorphism Ejecutivo (.vidrio-fuerte)
 * para el módulo de Vendedor B2B.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/autenticacion';
import { Insignia } from '@/components/Insignia';
import {
  Store,
  FileText,
  Receipt,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import {
  VENDEDOR_B2B_NAV_CATEGORIES,
  VENDEDOR_B2B_NAV_ITEMS,
  isVendedorB2BRouteActive,
  type VendedorB2BNavIconName,
  type VendedorB2BNavItemConfig,
} from './vendedor-b2b.navigation.config';

export interface VendedorB2BSidebarProps {
  onAbrirCotizaciones?: () => void;
  onAbrirHistorial?: () => void;
  cotizacionesAprobadasCount?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  className?: string;
}

const NAV_ICONS: Record<VendedorB2BNavIconName, React.ReactNode> = {
  catalogo: <Store className="w-4 h-4 shrink-0" />,
  cotizaciones: <FileText className="w-4 h-4 shrink-0" />,
  historial: <Receipt className="w-4 h-4 shrink-0" />,
  panel: <LayoutDashboard className="w-4 h-4 shrink-0" />,
};

export function VendedorB2BSidebar({
  onAbrirCotizaciones,
  onAbrirHistorial,
  cotizacionesAprobadasCount = 0,
  mobileOpen = false,
  onCloseMobile,
  className = '',
}: VendedorB2BSidebarProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const pathname = usePathname() || '';
  const [colapsado, setColapsado] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/acceso');
  };

  const handleItemClick = (item: VendedorB2BNavItemConfig, isMobileDrawer = false) => {
    if (isMobileDrawer) onCloseMobile?.();

    if (item.action === 'cotizaciones') {
      onAbrirCotizaciones?.();
    } else if (item.action === 'historial') {
      onAbrirHistorial?.();
    } else if (item.action === 'panel') {
      router.push('/dashboard');
    }
  };

  const renderItem = (item: VendedorB2BNavItemConfig, isMobileDrawer = false) => {
    const isCollapsed = !isMobileDrawer && colapsado;
    const isActive = item.href ? isVendedorB2BRouteActive(pathname, item.href, Boolean(item.exact)) : false;

    const baseClass = `
      flex items-center transition-all duration-150 cursor-pointer rounded-xl
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60
      ${
        isCollapsed
          ? 'p-2.5 justify-center w-11 h-11 relative'
          : 'w-full px-3 py-2 text-left gap-3 text-xs font-sans font-medium'
      }
      ${
        isActive
          ? 'bg-brand-600/15 dark:bg-brand-500/18 border border-brand-600/30 dark:border-brand-400/40 text-brand-700 dark:text-slate-100 font-semibold shadow-sm'
          : 'border border-transparent text-text-muted font-normal hover:text-text hover:bg-slate-900/5 dark:hover:bg-white/6'
      }
    `;

    const iconNode = (
      <span className={isActive ? 'text-brand-500' : 'text-text-muted'}>
        {NAV_ICONS[item.icon]}
      </span>
    );

    const content = (
      <>
        {iconNode}
        {!isCollapsed && <span className="truncate flex-1">{item.label}</span>}
        {!isCollapsed && item.id === 'cotizaciones' && cotizacionesAprobadasCount > 0 && (
          <Insignia variante="success" tamano="sm" className="ml-auto font-medium">
            {cotizacionesAprobadasCount}
          </Insignia>
        )}
        {isCollapsed && item.id === 'cotizaciones' && cotizacionesAprobadasCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500 ring-2 ring-bg" />
        )}
      </>
    );

    if (item.href && !item.action) {
      return (
        <Link
          key={item.id}
          href={item.href}
          onClick={() => {
            if (isMobileDrawer) onCloseMobile?.();
          }}
          aria-current={isActive ? 'page' : undefined}
          title={isCollapsed ? item.label : undefined}
          className={baseClass}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleItemClick(item, isMobileDrawer)}
        aria-current={isActive ? 'page' : undefined}
        title={isCollapsed ? item.label : undefined}
        className={baseClass}
      >
        {content}
      </button>
    );
  };

  const renderSidebarContent = (isMobileDrawer = false) => {
    const isCollapsed = !isMobileDrawer && colapsado;

    return (
      <aside
        className={`
          vidrio-fuerte rounded-2xl flex flex-col justify-between
          transition-all duration-300 select-none overflow-hidden shrink-0
          ${isMobileDrawer ? 'h-full w-64' : `h-[calc(100vh-2rem)] ${isCollapsed ? 'w-20' : 'w-64'}`}
          ${className}
        `}
        aria-label="Barra lateral de navegación"
      >
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* 1. Header con Logo Oficial y botón Colapsar / Cerrar a la derecha */}
          <div
            className={`h-16 px-4 flex items-center border-b border-border shrink-0 ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-btn-primario-texto font-sans font-semibold text-sm shrink-0 shadow-sm shadow-brand-600/30 transition-colors duration-300"
                title="WarEngine — Vendedor B2B"
                aria-label="Logo de WarEngine"
              >
                W
              </div>

              {!isCollapsed && (
                <div className="min-w-0">
                  <span className="font-titulos font-semibold text-sm tracking-normal text-text block leading-tight">
                    WarEngine
                  </span>
                  <span className="font-sans text-xs font-medium text-text-muted block leading-tight mt-0.5 whitespace-nowrap">
                    Ventas B2B
                  </span>
                </div>
              )}
            </div>

            {isMobileDrawer ? (
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-slate-900/5 dark:hover:bg-white/8 transition-colors shrink-0 cursor-pointer ml-auto"
                title="Cerrar menú"
                aria-label="Cerrar menú"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              !isCollapsed && (
                <button
                  type="button"
                  onClick={() => setColapsado(true)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-slate-900/5 dark:hover:bg-white/8 transition-colors shrink-0 cursor-pointer ml-auto"
                  title="Colapsar barra lateral"
                  aria-label="Colapsar barra lateral"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )
            )}
          </div>

          {/* 2. Navegación por Secciones (MENÚ, OPERACIONES, SISTEMA) */}
          <nav
            className={`p-3 space-y-5 flex-1 ${
              isCollapsed ? 'flex flex-col items-center' : ''
            }`}
            aria-label="Navegación principal"
          >
            {VENDEDOR_B2B_NAV_CATEGORIES.map((categoria) => {
              const itemsCategoria = VENDEDOR_B2B_NAV_ITEMS.filter(
                (it) => it.categoria === categoria,
              );
              return (
                <div
                  key={categoria}
                  className={`space-y-1.5 ${
                    isCollapsed ? 'w-full flex flex-col items-center' : ''
                  }`}
                >
                  {!isCollapsed ? (
                    <p className="px-3 text-xs font-sans font-medium uppercase tracking-wide text-text-muted">
                      {categoria}
                    </p>
                  ) : (
                    <div
                      className="w-6 h-px bg-border my-1"
                      aria-hidden="true"
                    />
                  )}
                  <div
                    className={`space-y-1 ${
                      isCollapsed ? 'w-full flex flex-col items-center' : ''
                    }`}
                  >
                    {itemsCategoria.map((item) =>
                      renderItem(item, isMobileDrawer),
                    )}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* 3. Pie del Sidebar: botón de expandir (en modo colapsado) arriba de Cerrar sesión */}
        <div className="p-3 border-t border-border shrink-0 space-y-1">
          {isCollapsed && (
            <button
              type="button"
              onClick={() => setColapsado(false)}
              className="w-full flex items-center justify-center p-2.5 rounded-xl text-text-muted hover:text-text hover:bg-slate-900/5 dark:hover:bg-white/8 transition-colors cursor-pointer"
              title="Expandir barra lateral"
              aria-label="Expandir barra lateral"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsed ? 'Cerrar sesión' : undefined}
            className={`w-full flex items-center gap-3 rounded-xl text-xs font-sans font-medium text-text-muted hover:text-text hover:bg-slate-900/5 dark:hover:bg-white/6 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0 text-text-muted" />
            {!isCollapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>
    );
  };

  return (
    <>
      {/* Sidebar fijo en Desktop */}
      <div className="hidden md:block">{renderSidebarContent(false)}</div>

      {/* Cajón deslizable en Móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            aria-hidden="true"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
