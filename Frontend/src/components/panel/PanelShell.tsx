'use client';

/**
 * PanelShell.tsx — Marco del panel administrativo (sidebar + header + contenido).
 *
 * - Espera la rehidratación de la sesión (GET /auth/verificar) antes de pintar.
 * - Si la sesión no es válida redirige a /acceso (el middleware ya cubre la mayoría
 *   de casos; esto atrapa cookies vencidas que no pudieron renovarse).
 * - Monta el ToastProvider para todas las vistas del panel.
 */

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/autenticacion';
import { ToastProvider } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';
import { Sidebar } from './Sidebar';
import { PanelHeader } from './PanelHeader';

export function PanelShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/acceso?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-[#0d1630] text-[#e9b949] font-[family-name:var(--font-pixelify)]">
        <Spinner size={36} label="Cargando sesión" />
        <span className="text-sm">{isLoading ? 'Verificando sesión…' : 'Redirigiendo al acceso…'}</span>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-dvh flex bg-[#0d1630] text-white">
        <Sidebar open={menuAbierto} onClose={() => setMenuAbierto(false)} />
        <div className="flex-1 min-w-0 flex flex-col">
          <PanelHeader onMenuClick={() => setMenuAbierto(true)} />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
