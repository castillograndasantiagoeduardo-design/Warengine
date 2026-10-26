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

      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

      {/* Terminales Operativas y Vistas del Proyecto */}
      <section className="max-w-6xl mx-auto">
        <h2 className="text-sm font-bold text-[#E9B949] uppercase tracking-wider mb-4">
          Terminales Operativas y Módulos de Venta
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tarjeta Vendedor B2B */}
          <div className="p-6 rounded-2xl bg-[#14213D] border border-[#E9B949]/40 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E9B949]/20 text-[#E9B949] border border-[#E9B949]/30 uppercase">
                  Módulo B2B &bull; Corporativo
                </span>
                <span className="text-[11px] text-white/50">RF-FMC-A6 / B13</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Terminal de Ventas B2B</h3>
              <p className="text-xs text-white/70 leading-relaxed mb-4">
                Catálogo multi-bodega expandido con precios corporativos, cotizaciones dinámicas y facturación comercial a crédito sin requerimiento de turno físico.
              </p>
            </div>
            <button
              onClick={() => router.push('/vendedor-b2b')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#E9B949] to-[#b88a1f] text-[#14213D] font-bold text-xs uppercase tracking-wider hover:brightness-110 cursor-pointer shadow"
            >
              Abrir Terminal Vendedor B2B &rarr;
            </button>
          </div>

          {/* Tarjeta Punto de Venta POS */}
          <div className="p-6 rounded-2xl bg-[#14213D] border border-white/10 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                  Módulo Retail &bull; Cajero
                </span>
                <span className="text-[11px] text-white/50">RF-FMC-A1 / A4</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Punto de Venta (POS)</h3>
              <p className="text-xs text-white/70 leading-relaxed mb-4">
                Terminal de caja de mostrador con control de apertura/cierre de turnos de caja, cobro en efectivo y emisión de tickets térmicos.
              </p>
            </div>
            <button
              onClick={() => router.push('/pos')}
              className="w-full py-2.5 rounded-xl border border-white/20 hover:border-white/40 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/5 cursor-pointer transition-colors"
            >
              Abrir Terminal POS Mostrador &rarr;
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
