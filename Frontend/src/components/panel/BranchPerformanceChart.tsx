'use client';

import React, { useEffect, useState } from 'react';
import { fetchRendimientoSucursales, RendimientoSucursalItem } from '@/features/administracion/api/dashboard.api';

export function BranchPerformanceChart() {
  const [dbData, setDbData] = useState<RendimientoSucursalItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await fetchRendimientoSucursales();
      if (res.data) {
        setDbData(res.data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const defaultFallback = [
    {
      sucursalId: 1,
      nombreSucursal: 'Sede Principal (Central #1)',
      totalIngresos: 68500000,
      totalCostos: 39500000,
      gananciaBruta: 29000000,
      cantidadVentas: 242,
      margenPorcentaje: 42.3,
    },
    {
      sucursalId: 2,
      nombreSucursal: 'Sucursal Norte - Distribución',
      totalIngresos: 38200000,
      totalCostos: 22100000,
      gananciaBruta: 16100000,
      cantidadVentas: 135,
      margenPorcentaje: 42.1,
    },
    {
      sucursalId: 3,
      nombreSucursal: 'Sucursal Occidente - Retail',
      totalIngresos: 21750000,
      totalCostos: 12520000,
      gananciaBruta: 9230000,
      cantidadVentas: 75,
      margenPorcentaje: 42.4,
    },
  ];

  const hasDbRows = dbData.length > 0;
  const branches = hasDbRows ? dbData : defaultFallback;
  const totalGlobal = branches.reduce((acc, b) => acc + Number(b.totalIngresos), 0) || 1;

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
              Comparativa de volumen de facturación y margen por sede (/dashboard/rendimiento)
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-[family-name:var(--font-pixelify)]">
            {branches.length} SEDES EVALUADAS
          </span>
        </div>

        {/* Listado de Sucursales con Barras de Rendimiento */}
        <div className="mt-4 space-y-4">
          {branches.map((b) => {
            const porcentaje = Math.round((Number(b.totalIngresos) / totalGlobal) * 100) || 0;
            return (
              <div key={b.sucursalId} className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-[family-name:var(--font-archivo)]">
                      {b.nombreSucursal}
                    </span>
                    {b.sucursalId === 1 && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#e3b341]/20 text-[#e3b341] border border-[#e3b341]/30 font-[family-name:var(--font-pixelify)]">
                        MATRIZ
                      </span>
                    )}
                  </div>
                  <span className="font-[family-name:var(--font-anton)] text-sm tracking-wide text-[#e3b341]">
                    {formatCurrency(Number(b.totalIngresos))}
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#b88a1f] to-[#e3b341] transition-all duration-500"
                    style={{ width: `${Math.max(porcentaje, 4)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-white/50 mt-2 font-[family-name:var(--font-archivo)]">
                  <span>{b.cantidadVentas} Comprobantes · Ganancia: <strong className="text-emerald-400">{formatCurrency(Number(b.gananciaBruta))}</strong></span>
                  <span className="font-bold text-white/80 font-[family-name:var(--font-pixelify)]">{porcentaje}% total</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-white/40 flex items-center justify-between font-[family-name:var(--font-archivo)]">
        <span>Calculado en tiempo real desde MySQL</span>
        <span className="text-[#e3b341] font-[family-name:var(--font-pixelify)]">
          {hasDbRows ? 'DATOS VIVOS DE BD' : 'MODO BASE INICIAL'}
        </span>
      </div>
    </div>
  );
}
