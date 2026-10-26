'use client';

/**
 * BranchSidebar.tsx — Barra de navegación lateral contextual para la sede activa.
 *
 * Principio SOLID: Single Responsibility (SRP).
 * Encapsula la identidad corporativa de WarEngine, los enlaces del panel de control
 * y el perfil del usuario autenticado según los tokens del diseño de Figma (nodo 0:1).
 */

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/autenticacion';
import {
  LayoutDashboardIcon,
  PackageIcon,
  UsersRoundIcon,
  ReceiptTextIcon,
  BarChartIcon,
  SettingsIcon,
  ShieldIcon,
  LogOutIcon,
  TruckIcon,
  BoxesIcon,
} from './Icons';

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
  badge?: string;
  href?: string;
}

const MENU_ITEMS: NavItem[] = [
  { id: 'resumen', label: 'Resumen', icon: <LayoutDashboardIcon size={18} /> },
  { id: 'inventario', label: 'Inventario & Stock', icon: <PackageIcon size={18} /> },
  { id: 'movimientos', label: 'Movimientos Sede', icon: <BoxesIcon size={18} /> },
  { id: 'proveedores', label: 'Proveedores', icon: <TruckIcon size={18} /> },
  { id: 'cajeros', label: 'Cajeros & Turnos', icon: <UsersRoundIcon size={18} /> },
  { id: 'facturacion', label: 'Facturación & Ventas', icon: <ReceiptTextIcon size={18} /> },
];

const SISTEMA_ITEMS: NavItem[] = [
  // Por ahora oculto hasta la fase de configuración de sede:
  // { id: 'configuracion', label: 'Configuración Sede', icon: <SettingsIcon size={18} /> },
];

export function BranchSidebar({
  activeSection = 'resumen',
  onSelectSection,
  onOpenProfile,
  className = '',
}: BranchSidebarProps) {
  const { usuario, logout } = useAuth();

  const handleItemClick = (item: NavItem, e: React.MouseEvent) => {
    if (item.href) return;
    e.preventDefault();
    onSelectSection?.(item.id);
  };

  const userInitial = usuario?.email ? usuario.email.charAt(0).toUpperCase() : 'AS';
  const userDisplayName = usuario?.email ? usuario.email.split('@')[0] : 'Admin Sucursal';

  return (
    <aside
      className={`
        flex flex-col justify-between w-[218px] shrink-0
        bg-[#09132b]/80 backdrop-blur-xl border-r border-white/[0.08]
        p-4 select-none min-h-screen text-slate-300
        ${className}
      `}
    >
      {/* 1. Header con Logotipo Oficial de WarEngine */}
      <div>
        <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-white/[0.06]">
          <div className="w-8 h-8 shrink-0">
            <svg
              viewBox="60 50 1015 575"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto block"
              aria-label="Logo WarEngine"
            >
              <polygon
                fill="#D9A02D"
                points="75,85 445,215 490,305 428,452 600,213 665,300 487,610 385,425 235,318 180,240 360,305 130,165"
              />
              <polygon
                fill="#ffffff"
                points="1060,65 740,590 635,432 700,335 745,415 830,218 775,205"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-[family-name:var(--font-anton)] text-xl tracking-wider text-white uppercase leading-none">
              WarEngine
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#e3b341] font-[family-name:var(--font-pixelify)]">
              Admin Sucursal
            </span>
          </div>
        </div>

        {/* 2. Sección MENU */}
        <div className="mb-6">
          <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-[family-name:var(--font-pixelify)] mb-2">
            Menu
          </span>
          <nav className="flex flex-col gap-1">
            {MENU_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              const content = (
                <div
                  className={`
                    flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium
                    transition-all duration-150 cursor-pointer
                    ${
                      isActive
                        ? 'bg-[#e3b341]/10 text-[#e3b341] border border-[#e3b341]/25 font-semibold shadow-[0_2px_8px_rgba(227,179,65,0.12)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-[#e3b341]' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span className="font-[family-name:var(--font-archivo)]">
                      {item.label}
                    </span>
                  </div>
                  {item.badge && (
                    <span
                      className={`
                        text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono
                        ${
                          isActive
                            ? 'bg-[#e3b341]/20 text-[#e3b341]'
                            : 'bg-white/[0.06] text-slate-400'
                        }
                      `}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              );

              if (item.href) {
                return (
                  <Link key={item.id} href={item.href}>
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={(e) => handleItemClick(item, e)}
                  className="w-full text-left"
                >
                  {content}
                </button>
              );
            })}
          </nav>
        </div>

        {/* 3. Sección SISTEMA (Oculta mientras no tenga items activos) */}
        {SISTEMA_ITEMS.length > 0 && (
          <div>
            <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-[family-name:var(--font-pixelify)] mb-2">
              Sistema
            </span>
            <nav className="flex flex-col gap-1">
              {SISTEMA_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={(e) => handleItemClick(item, e)}
                    className={`
                      flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-medium
                      transition-all duration-150 cursor-pointer
                      ${
                        isActive
                          ? 'bg-[#e3b341]/10 text-[#e3b341] border border-[#e3b341]/25 font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }
                    `}
                  >
                    <span className={isActive ? 'text-[#e3b341]' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span className="font-[family-name:var(--font-archivo)]">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* 4. Footer: Perfil del Administrador y Cierre de Sesión */}
      <div className="pt-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
          <button
            type="button"
            onClick={onOpenProfile}
            title="Ver y editar mi información de contacto"
            className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer group flex-1"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#b88a1f] to-[#e3b341] text-[#0d1630] font-bold text-xs font-[family-name:var(--font-pixelify)] shadow-sm group-hover:scale-105 transition-transform">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate font-[family-name:var(--font-archivo)] group-hover:text-[#e3b341] transition-colors">
                {userDisplayName}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                <span className="text-[10px] text-slate-400 truncate">
                  Mi Perfil
                </span>
              </div>
            </div>
          </button>

          <button
            onClick={() => logout()}
            title="Cerrar sesión"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
          >
            <LogOutIcon size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
