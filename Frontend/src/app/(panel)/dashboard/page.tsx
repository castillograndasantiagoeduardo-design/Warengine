'use client';

/**
 * DashboardPage — Panel administrativo principal de WarEngine.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/autenticacion';

export default function DashboardPage() {
  const router = useRouter();
  const { usuario, permisos, logout, isAuthenticated, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/acceso');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1630] flex items-center justify-center text-[#E9B949] font-mono">
        Cargando sesión...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d1630] text-white p-6 font-[family-name:var(--font-archivo)]">
      <header className="max-w-6xl mx-auto flex items-center justify-between border-b border-white/10 pb-4 mb-8">
        <div>
          <h1 className="text-2xl font-[family-name:var(--font-anton)] text-[#E9B949] tracking-wider uppercase">
            WarEngine &mdash; Panel Administrativo
          </h1>
          <p className="text-xs text-white/60">
            Sesión activa: <span className="text-white font-medium">{usuario?.email || usuario?.id}</span> &bull; Rol:{' '}
            <span className="text-[#E9B949] uppercase font-bold">{usuario?.rolNombre}</span>
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-full border border-red-500/40 text-red-300 hover:bg-red-500/20 text-xs font-[family-name:var(--font-pixelify)] uppercase cursor-pointer transition-colors"
        >
          Cerrar Sesión
        </button>
      </header>

      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-[#14213D] border border-white/10 shadow-lg">
          <h3 className="font-bold text-[#E9B949] text-sm uppercase mb-2">Estado de Conexión</h3>
          <p className="text-xs text-white/80">
            {isAuthenticated ? '🟢 Autenticado correctamente con cookies HttpOnly' : '🔴 No autenticado'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#14213D] border border-white/10 shadow-lg">
          <h3 className="font-bold text-[#E9B949] text-sm uppercase mb-2">Permisos Activos</h3>
          <p className="text-xs text-white/80">
            {permisos.length > 0 ? `${permisos.length} permisos asignados` : 'Acceso general SuperAdmin'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#14213D] border border-white/10 shadow-lg">
          <h3 className="font-bold text-[#E9B949] text-sm uppercase mb-2">Sucursales</h3>
          <p className="text-xs text-white/80">Sede Principal (id=1)</p>
        </div>
      </section>
    </main>
  );
}
