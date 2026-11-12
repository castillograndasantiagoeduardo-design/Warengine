'use client';

/**
 * BranchLayout.tsx — Layout maestro con Glassmorphism Ejecutivo para Admin de Sucursal.
 *
 * Estructura:
 * 1. FondoAmbiental fijo en fixed inset-0 (-z-10)
 * 2. Sidebar flotante sticky en desktop
 * 3. Columna derecha con Navbar sticky y área principal de contenido
 */

import React, { useState } from 'react';
import { BranchSidebar, BranchSection } from './BranchSidebar';
import { BranchHeader } from './BranchHeader';
import { FondoAmbiental } from './FondoAmbiental';
import type { DashboardPeriodo } from '../types/branch-dashboard.types';

interface BranchLayoutProps {
  children: React.ReactNode;
  activeSection?: BranchSection;
  onSelectSection?: (section: BranchSection) => void;
  periodo?: DashboardPeriodo;
  onPeriodoChange?: (periodo: DashboardPeriodo) => void;
  sucursalNombre?: string;
  ultimaSincronizacion?: string;
  isOnline?: boolean;
  onOpenProfile?: () => void;
}

export function BranchLayout({
  children,
  activeSection = 'resumen',
  onSelectSection,
  periodo = 'hoy',
  onPeriodoChange,
  sucursalNombre = 'Sucursal Activa',
  onOpenProfile,
}: BranchLayoutProps) {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen bg-bg text-text font-sans relative isolate overflow-x-clip transition-colors duration-300">
      {/* 1. Fondo Ambiental Dinámico Detrás del Cristal (-z-10) */}
      <FondoAmbiental />

      {/* 2. Contenedor Principal con Separación de 24px (gap-6) */}
      <div className="flex items-start p-4 sm:p-5 lg:p-6 gap-6 max-w-[1680px] mx-auto min-h-screen">
        {/* Sidebar Flotante Sticky en Desktop */}
        <div className="hidden md:block sticky top-4 self-start z-30 shrink-0">
          <BranchSidebar
            activeSection={activeSection}
            onSelectSection={onSelectSection}
            onOpenProfile={onOpenProfile}
          />
        </div>

        {/* Columna Derecha: Navbar Sticky + Main */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <BranchHeader
            periodo={periodo}
            onPeriodoChange={onPeriodoChange}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sucursalNombre={sucursalNombre}
            onOpenProfile={onOpenProfile}
          />

          <main className="space-y-6 flex-1 pb-6 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
