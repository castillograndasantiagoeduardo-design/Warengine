'use client';

/**
 * BranchLayout.tsx — Layout maestro con Glassmorphism Ejecutivo para Admin de Sucursal.
 *
 * Estructura:
 * 1. FondoAmbiental fijo en fixed inset-0 (-z-10)
 * 2. Sidebar flotante sticky en desktop + drawer en móvil
 * 3. Columna derecha con Navbar sticky y área principal de contenido
 */

import React, { createContext, useContext, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BranchSidebar } from './BranchSidebar';
import { BranchHeader } from './BranchHeader';
import { FondoAmbiental } from './FondoAmbiental';
import { DEFAULT_DASHBOARD_PERIODO } from '../config/branch-navigation.config';
import type { DashboardPeriodo } from '../types/branch-dashboard.types';

interface BranchLayoutContextValue {
  periodo: DashboardPeriodo;
  cambiarPeriodo: (nuevo: DashboardPeriodo) => void;
}

const BranchLayoutContext = createContext<BranchLayoutContextValue>({
  periodo: DEFAULT_DASHBOARD_PERIODO,
  cambiarPeriodo: () => {},
});

export function useBranchLayoutPeriodo() {
  return useContext(BranchLayoutContext);
}

interface BranchLayoutProps {
  children: React.ReactNode;
  periodo?: DashboardPeriodo;
  onPeriodoChange?: (periodo: DashboardPeriodo) => void;
  sucursalNombre?: string;
  ultimaSincronizacion?: string;
  isOnline?: boolean;
  onOpenProfile?: () => void;
}

export function BranchLayout({
  children,
  periodo: periodoProp,
  onPeriodoChange,
  sucursalNombre = 'Sucursal Activa',
  onOpenProfile,
}: BranchLayoutProps) {
  const pathname = usePathname() || '';
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [periodoInterno, setPeriodoInterno] = useState<DashboardPeriodo>(
    periodoProp ?? DEFAULT_DASHBOARD_PERIODO,
  );

  const periodoActivo = periodoProp ?? periodoInterno;
  const handlePeriodoChange = (nuevo: DashboardPeriodo) => {
    setPeriodoInterno(nuevo);
    onPeriodoChange?.(nuevo);
  };

  const esDashboardPrincipal =
    (pathname.replace(/\/+$/, '') || '/') === '/admin-sucursal';

  return (
    <BranchLayoutContext.Provider
      value={{ periodo: periodoActivo, cambiarPeriodo: handlePeriodoChange }}
    >
      <div className="min-h-screen bg-bg text-text font-sans relative isolate overflow-x-clip transition-colors duration-300">
        {/* 1. Fondo Ambiental Dinámico Detrás del Cristal (-z-10) */}
        <FondoAmbiental />

        {/* 2. Contenedor Principal con Separación de 24px (gap-6) */}
        <div className="flex items-start p-4 sm:p-5 lg:p-6 gap-6 max-w-[1680px] mx-auto min-h-screen">
          {/* Sidebar Flotante Sticky en Desktop + Drawer en Móvil */}
          <div className="md:sticky md:top-4 md:self-start z-30 shrink-0">
            <BranchSidebar
              onOpenProfile={onOpenProfile}
              mobileOpen={mobileMenuOpen}
              onCloseMobile={() => setMobileMenuOpen(false)}
            />
          </div>

          {/* Columna Derecha: Navbar Sticky + Main */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            <BranchHeader
              periodo={periodoActivo}
              onPeriodoChange={handlePeriodoChange}
              showPeriodoSelector={esDashboardPrincipal}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              sucursalNombre={sucursalNombre}
              onOpenProfile={onOpenProfile}
              onOpenMobileMenu={() => setMobileMenuOpen(true)}
            />

            <main className="space-y-6 flex-1 pb-6 min-w-0">{children}</main>
          </div>
        </div>
      </div>
    </BranchLayoutContext.Provider>
  );
}
