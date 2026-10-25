'use client';

/**
 * PosPage — Terminal Punto de Venta (POS) para cajeros de WarEngine.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/autenticacion';

export default function PosPage() {
  const router = useRouter();
  const { usuario, logout, isAuthenticated, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/acceso');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1630] flex items-center justify-center text-[#E9B949] font-mono">
        Cargando terminal POS...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d1630] text-white p-6 font-[family-name:var(--font-archivo)]">
      <header className="max-w-6xl mx-auto flex items-center justify-between border-b border-white/10 pb-4 mb-8">
        <div>
          <h1 className="text-2xl font-[family-name:var(--font-anton)] text-[#E9B949] tracking-wider uppercase">
            WarEngine &mdash; Punto de Venta (POS)
          </h1>
          <p className="text-xs text-white/60">
            Cajero:{' '}
            <span className="text-white font-medium">{usuario?.email || usuario?.id}</span> &bull; Rol:{' '}
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

      <section className="max-w-6xl mx-auto p-6 rounded-2xl bg-[#14213D] border border-white/10 shadow-lg">
        <h3 className="font-bold text-[#E9B949] text-base uppercase mb-2">Terminal de Caja Activa</h3>
        <p className="text-xs text-white/80 leading-relaxed mb-4">
          Sesión de cajero autenticada correctamente ({isAuthenticated ? '🟢 Conectado' : '🔴 Desconectado'}). Listo para apertura de turno de caja y facturación rápida de mostrador.
        </p>
      </section>
    </main>
  );
}
