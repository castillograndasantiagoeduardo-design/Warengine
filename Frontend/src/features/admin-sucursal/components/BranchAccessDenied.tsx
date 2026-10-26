'use client';

/**
 * BranchAccessDenied.tsx — Pantalla de seguridad para bloqueo de acceso por rol (RBAC).
 * 
 * Principio SOLID: Single Responsibility Principle (SRP).
 * Comunica con claridad la restricción de rol al usuario y ofrece opciones seguras de navegación.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button3D } from '@/components/ui/Button3D';
import { ShieldIcon } from './Icons';

interface BranchAccessDeniedProps {
  rolActual?: string | null;
  onLogout: () => Promise<void>;
}

export function BranchAccessDenied({
  rolActual,
  onLogout,
}: BranchAccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0d1630] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-2xl bg-[#111d3f]/90 border border-amber-500/30 backdrop-blur-md shadow-2xl text-center space-y-5 animate-in fade-in duration-300">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <ShieldIcon size={32} />
        </div>

        <div>
          <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold font-[family-name:var(--font-pixelify)]">
            Acceso Restringido
          </span>
          <h1 className="text-2xl font-[family-name:var(--font-anton)] text-white tracking-wide uppercase mt-1">
            Solo Admin de Sucursal
          </h1>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed font-[family-name:var(--font-archivo)]">
            Este panel de control está reservado exclusivamente para cuentas con rol{' '}
            <strong className="text-amber-400">admin-sucursal</strong>.
          </p>
          <div className="mt-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 font-[family-name:var(--font-archivo)]">
            Rol actual detectado:{' '}
            <span className="font-semibold text-white uppercase">{rolActual || 'No autorizado'}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <Button3D
            size="md"
            className="w-full justify-center text-center font-bold"
            onClick={async () => {
              await onLogout();
              router.push('/acceso');
            }}
          >
            Iniciar como Admin de Sucursal
          </Button3D>

          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 px-4 rounded-xl border border-white/20 text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-xs font-[family-name:var(--font-pixelify)] uppercase cursor-pointer"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
