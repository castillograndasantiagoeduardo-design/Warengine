'use client';

/**
 * BranchLayout.tsx — Layout maestro contenedor para el panel de administración de sucursal.
 *
 * Principio SOLID: Single Responsibility (SRP) & Composite Pattern.
 * Ensambla el Sidebar contextual, Header de búsqueda/acciones, área de contenido scrollable
 * y StatusBar inferior en un layout de alta densidad responsivo.
 */

import React, { useState } from 'react';
import { BranchSidebar, BranchSection } from './BranchSidebar';
import { BranchHeader } from './BranchHeader';
import { BranchStatusBar } from './BranchStatusBar';
import type { DashboardPeriodo } from '../types/branch-dashboard.types';

interface BranchLayoutProps {
  children: React.ReactNode;
  activeSection?: BranchSection;
  onSelectSection?: (section: BranchSection) => void;
  periodo?: DashboardPeriodo;
  onPeriodoChange?: (periodo: DashboardPeriodo) => void;
  onNuevoProductoClick?: () => void;
  sucursalNombre?: string;
  ultimaSincronizacion?: string;
  isOnline?: boolean;
}

export function BranchLayout({
  children,
  activeSection = 'resumen',
  onSelectSection,
  periodo = 'hoy',
  onPeriodoChange,
  onNuevoProductoClick,
  sucursalNombre = 'Sede Norte',
  ultimaSincronizacion,
  isOnline = true,
}: BranchLayoutProps) {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0d1630] text-slate-100 font-[family-name:var(--font-archivo)]">
      {/* 1. Sidebar Fijo a la Izquierda */}
      <BranchSidebar
        activeSection={activeSection}
        onSelectSection={onSelectSection}
        className="hidden md:flex"
      />

      {/* 2. Área Central de Contenido y Cabecera */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* Cabecera */}
        <BranchHeader
          periodo={periodo}
          onPeriodoChange={onPeriodoChange}
          onNuevoProductoClick={onNuevoProductoClick}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sucursalNombre={sucursalNombre}
        />

        {/* Cuerpo Principal Scrollable */}
        <main className="flex-1 overflow-y-auto px-4 md:px-7 py-5 custom-scrollbar">
          <div className="max-w-[1440px] mx-auto space-y-5">
            {children}
          </div>
        </main>

        {/* Pie de Página de Telemetría */}
        <BranchStatusBar
          ultimaSincronizacion={ultimaSincronizacion}
          isOnline={isOnline}
        />
      </div>
    </div>
  );
}
