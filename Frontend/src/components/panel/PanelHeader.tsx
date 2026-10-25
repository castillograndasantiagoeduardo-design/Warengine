'use client';

/**
 * PanelHeader.tsx — Barra superior del panel: menú móvil, identidad del usuario y cierre de sesión.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/autenticacion';
import { Button3D } from '@/components/ui/Button3D';
import { Spinner } from '@/components/ui/Spinner';

const ROL_ETIQUETA: Record<string, string> = {
  'super-admin': 'Super Admin',
  'admin-sucursal': 'Admin de sucursal',
  cajero: 'Cajero',
  'vendedor-b2b': 'Vendedor B2B',
};

export function PanelHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const { usuario, logout } = useAuth();
  const [saliendo, setSaliendo] = useState(false);

  const handleLogout = async () => {
    setSaliendo(true);
    await logout();
    router.replace('/acceso');
  };

  const rol = usuario ? (ROL_ETIQUETA[usuario.rolNombre] ?? usuario.rolNombre) : '';
  // /auth/verificar no devuelve el correo: tras recargar solo se conoce el rol
  const identidad = usuario?.email || rol;
  const inicial = (usuario?.email || rol || '?').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-[#0d1630]/90 backdrop-blur-md px-4 sm:px-6 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú"
        className="lg:hidden min-h-[44px] min-w-[44px] rounded-lg text-2xl text-white/80 hover:bg-white/10 cursor-pointer"
      >
        ☰
      </button>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-sm text-white">{identidad}</span>
          <span className="text-[11px] uppercase tracking-wider text-[#e9b949] font-[family-name:var(--font-pixelify)]">{rol}</span>
        </div>
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e3b341] text-[#111] font-[family-name:var(--font-anton)] text-lg"
        >
          {inicial}
        </span>
        <Button3D size="panel-sm" variant="navy" type="button" onClick={handleLogout} disabled={saliendo}>
          {saliendo ? <Spinner size={14} label="Cerrando sesión" /> : '⏻'}
          <span className="hidden sm:inline">Cerrar sesión</span>
        </Button3D>
      </div>
    </header>
  );
}
