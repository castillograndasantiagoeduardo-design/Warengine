'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PanelSidebar } from '@/components/panel/PanelSidebar';
import { PanelTopbar } from '@/components/panel/PanelTopbar';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay';

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Verificación de credenciales en el cliente
    const token = localStorage.getItem('warengine_access_token');
    const userStr = localStorage.getItem('warengine_user');

    if (!token || !userStr) {
      router.replace('/acceso?error=unauthenticated');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.rolId !== 1 && user.rolNombre !== 'super-admin') {
        router.replace('/acceso?error=unauthorized_super_admin_only');
        return;
      }
      setIsAuthorized(true);
    } catch {
      router.replace('/acceso?error=invalid_session');
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full bg-[#0d1630] flex flex-col items-center justify-center text-white relative">
        <NoiseOverlay />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#e3b341] border-t-transparent animate-spin" />
          <span className="font-[family-name:var(--font-pixelify)] text-xs text-[#e3b341] tracking-widest uppercase">
            Verificando credenciales Super Admin...
          </span>
        </div>
      </div>
    );
  }

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

