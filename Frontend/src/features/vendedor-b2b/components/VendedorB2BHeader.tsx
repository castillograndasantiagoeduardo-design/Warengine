'use client';

/**
 * VendedorB2BHeader.tsx — Barra superior del módulo Vendedor B2B.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/autenticacion';

interface VendedorB2BHeaderProps {
  onAbrirHistorial: () => void;
}

export function VendedorB2BHeader({ onAbrirHistorial }: VendedorB2BHeaderProps) {
  const router = useRouter();
  const { usuario, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/acceso');
  };

  return (
    <header className="w-full bg-[#14213D]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-4 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Identidad de la marca y módulo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E9B949] to-[#b88a1f] flex items-center justify-center font-[family-name:var(--font-anton)] text-[#14213D] text-xl font-bold shadow-md">
            B2B
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-[family-name:var(--font-anton)] text-[#E9B949] tracking-wider uppercase">
                WarEngine &mdash; Ventas Corporativas
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E9B949]/20 text-[#E9B949] border border-[#E9B949]/40 uppercase tracking-widest">
                Catálogo Multi-Bodega
              </span>
            </div>
            <p className="text-xs text-white/60 font-[family-name:var(--font-archivo)]">
              Asesor:{' '}
              <span className="text-white font-medium">{usuario?.email || usuario?.id || 'Vendedor Autorizado'}</span> &bull; Rol:{' '}
              <span className="text-[#E9B949] uppercase font-semibold">{usuario?.rolNombre || 'vendedor-b2b'}</span>
            </p>
          </div>
        </div>

        {/* Acciones y control de sesión */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onAbrirHistorial}
            className="px-3.5 py-1.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-[family-name:var(--font-archivo)] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-[#E9B949]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Historial de Facturas
          </button>

          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-3 py-1.5 rounded-xl border border-white/20 hover:border-white/40 text-white/80 hover:text-white text-xs font-[family-name:var(--font-archivo)] transition-colors cursor-pointer"
          >
            Panel
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/20 text-xs font-[family-name:var(--font-archivo)] transition-colors cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
}
