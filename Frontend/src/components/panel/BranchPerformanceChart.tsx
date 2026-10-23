'use client';

import React from 'react';

interface BranchPerformance {
  id: number;
  nombre: string;
  ingresos: number;
  costos: number;
  ganancia: number;
  tickets: number;
  porcentaje: number;
}

export function BranchPerformanceChart() {
  const branches: BranchPerformance[] = [
    {
      id: 1,
      nombre: 'Sede Principal (Central #1)',
      ingresos: 68500000,
      costos: 39500000,
      ganancia: 29000000,
      tickets: 242,
      porcentaje: 53.3,
    },
    {
      id: 2,
      nombre: 'Sucursal Norte - Distribución',
      ingresos: 38200000,
      costos: 22100000,
      ganancia: 16100000,
      tickets: 135,
      porcentaje: 29.7,
    },
    {
      id: 3,
      nombre: 'Sucursal Occidente - Retail',
      ingresos: 21750000,
      costos: 12520000,
      ganancia: 9230000,
      tickets: 75,
      porcentaje: 17.0,
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-5 rounded-2xl bg-[#0f1733]/90 border border-white/10 flex flex-col justify-between backdrop-blur-sm select-none">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div>
            <h2 className="text-sm font-bold text-white font-[family-name:var(--font-archivo)] uppercase tracking-wider">
              Rendimiento por Sucursal (RF-ADM-A3)
            </h2>
            <p className="text-xs text-white/50 mt-0.5 font-[family-name:var(--font-archivo)]">
              Comparativa de volumen de facturación y margen por sede
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-[family-name:var(--font-pixelify)]">
            3 SEDES ACTIVAS
          </span>
        </div>

        {/* Listado de Sucursales con Barras de Rendimiento */}
        <div className="mt-4 space-y-4">
          {branches.map((b) => (
            <div key={b.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white font-[family-name:var(--font-archivo)]">
                    {b.nombre}
                  </span>
                  {b.id === 1 && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#e3b341]/20 text-[#e3b341] border border-[#e3b341]/30 font-[family-name:var(--font-pixelify)]">
                      MATRIZ
                    </span>
                  )}
                </div>
                <span className="font-[family-name:var(--font-anton)] text-sm tracking-wide text-[#e3b341]">
                  {formatCurrency(b.ingresos)}
                </span>
              </div>

              {/* Barra de progreso */}
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#b88a1f] to-[#e3b341] transition-all duration-500"
                  style={{ width: `${b.porcentaje}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/50 mt-2 font-[family-name:var(--font-archivo)]">
                <span>{b.tickets} Comprobantes · Ganancia: <strong className="text-emerald-400">{formatCurrency(b.ganancia)}</strong></span>
                <span className="font-bold text-white/80 font-[family-name:var(--font-pixelify)]">{b.porcentaje}% total</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-white/40 flex items-center justify-between font-[family-name:var(--font-archivo)]">
        <span>Sede Principal concentra el 53.3% del volumen bruto</span>
        <button className="text-[#e3b341] hover:underline cursor-pointer font-[family-name:var(--font-pixelify)]">
          VER DETALLE SEDES &rarr;
        </button>
      </div>
    </div>
  );
}
