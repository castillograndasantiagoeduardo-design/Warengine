'use client';

import React from 'react';
import { PanelSidebar } from '@/components/panel/PanelSidebar';
import { PanelTopbar } from '@/components/panel/PanelTopbar';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay';

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full bg-[#0d1630] text-white flex overflow-hidden">
      {/* Grano analógico sutil de fondo */}
      <NoiseOverlay />

      {/* Barra Lateral Navegación */}
      <PanelSidebar />

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Topbar Superior */}
        <PanelTopbar />

        {/* Contenido Dinámico de la Ruta */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
