'use client';

/**
 * VendedorB2BLayout.tsx — Layout maestro con Glassmorphism Ejecutivo para Vendedor B2B.
 *
 * Estructura:
 * 1. FondoAmbiental fijo en fixed inset-0 (-z-10)
 * 2. Sidebar flotante sticky en desktop + drawer en móvil
 * 3. Columna derecha con Header sticky y área principal de contenido
 */

import React, { useState } from 'react';
import { FondoAmbiental } from '@/components/FondoAmbiental';
import { VendedorB2BSidebar } from './VendedorB2BSidebar';
import { VendedorB2BHeader } from './VendedorB2BHeader';

export interface VendedorB2BLayoutProps {
  children: React.ReactNode;
  onAbrirCotizaciones?: () => void;
  onAbrirHistorial?: () => void;
  cotizacionesAprobadasCount?: number;
  onOpenProfile?: () => void;
}

export function VendedorB2BLayout({
  children,
  onAbrirCotizaciones,
  onAbrirHistorial,
  cotizacionesAprobadasCount = 0,
  onOpenProfile,
}: VendedorB2BLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-text font-sans relative isolate overflow-x-clip transition-colors duration-300">
      {/* 1. Fondo Ambiental Dinámico Detrás del Cristal (-z-10) */}
      <FondoAmbiental />

      {/* 2. Contenedor Principal con Separación de 24px (gap-6) */}
      <div className="flex items-start p-4 sm:p-5 lg:p-6 gap-6 max-w-[1680px] mx-auto min-h-screen">
        {/* Sidebar Flotante Sticky en Desktop + Drawer en Móvil */}
        <div className="md:sticky md:top-4 md:self-start z-30 shrink-0">
          <VendedorB2BSidebar
            onAbrirCotizaciones={onAbrirCotizaciones}
            onAbrirHistorial={onAbrirHistorial}
            cotizacionesAprobadasCount={cotizacionesAprobadasCount}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />
        </div>

        {/* Columna Derecha: Header Sticky + Main */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <VendedorB2BHeader
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
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
