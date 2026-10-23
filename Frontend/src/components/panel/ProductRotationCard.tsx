'use client';

import React, { useState } from 'react';

interface ProductItem {
  sku: string;
  nombre: string;
  categoria: string;
  unidadesVendidas: number;
  ingresosTotales: number;
  stockActual: number;
}

export function ProductRotationCard() {
  const [viewMode, setViewMode] = useState<'mas' | 'menos'>('mas');

  const topVendidos: ProductItem[] = [
    {
      sku: 'TAL-0941',
      nombre: 'Taladro Percutor Industrial 850W',
      categoria: 'Herramientas Eléctricas',
      unidadesVendidas: 148,
      ingresosTotales: 36260000,
      stockActual: 32,
    },
    {
      sku: 'DIS-2019',
      nombre: 'Disco Diamantado 7 Pulgadas Concreto',
      categoria: 'Abrasivos',
      unidadesVendidas: 320,
      ingresosTotales: 17600000,
      stockActual: 114,
    },
    {
      sku: 'GEL-1044',
      nombre: 'Guante de Seguridad Reforzado Nitrilo',
      categoria: 'Seguridad Industrial',
      unidadesVendidas: 540,
      ingresosTotales: 13500000,
      stockActual: 240,
    },
    {
      sku: 'CAB-3301',
      nombre: 'Cable Enchaquetado 3x12 AWG x 100m',
      categoria: 'Material Eléctrico',
      unidadesVendidas: 84,
      ingresosTotales: 12180000,
      stockActual: 18,
    },
  ];

  const menosVendidos: ProductItem[] = [
    {
      sku: 'SOL-8821',
      nombre: 'Careta Fotosensible para Soldadura Pro',
      categoria: 'Seguridad Industrial',
      unidadesVendidas: 2,
      ingresosTotales: 640000,
      stockActual: 45,
    },
    {
      sku: 'BOM-0023',
      nombre: 'Bomba Sumergible Aguas Negras 1.5HP',
      categoria: 'Maquinaria',
      unidadesVendidas: 1,
      ingresosTotales: 1450000,
      stockActual: 12,
    },
    {
      sku: 'MAR-5510',
      nombre: 'Martillo de Bronce Antichispa 2Lb',
      categoria: 'Herramientas Manuales',
      unidadesVendidas: 3,
      ingresosTotales: 480000,
      stockActual: 28,
    },
    {
      sku: 'CAL-9011',
      nombre: 'Calibrador Pie de Rey Digital 150mm',
      categoria: 'Instrumentación',
      unidadesVendidas: 4,
      ingresosTotales: 720000,
      stockActual: 35,
    },
  ];

  const currentList = viewMode === 'mas' ? topVendidos : menosVendidos;

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
          <div>
            <h2 className="text-sm font-bold text-white font-[family-name:var(--font-archivo)] uppercase tracking-wider">
              Rotación de Catálogo (RF-ADM-A4)
            </h2>
            <p className="text-xs text-white/50 mt-0.5 font-[family-name:var(--font-archivo)]">
              Productos líderes en facturación vs. inventario de baja rotación
            </p>
          </div>

          {/* Selector de Modo */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('mas')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer font-[family-name:var(--font-pixelify)] ${
                viewMode === 'mas'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              🔥 Más Vendidos
            </button>
            <button
              onClick={() => setViewMode('menos')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer font-[family-name:var(--font-pixelify)] ${
                viewMode === 'menos'
                  ? 'bg-amber-500 text-[#111111] shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              ❄️ Baja Rotación
            </button>
          </div>
        </div>

        {/* Tabla / Lista de Productos */}
        <div className="mt-4 space-y-2.5">
          {currentList.map((item, idx) => (
            <div
              key={item.sku}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between transition-colors gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-white/10 text-white/70 font-[family-name:var(--font-anton)] text-xs flex items-center justify-center shrink-0">
                  #{idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate font-[family-name:var(--font-archivo)]">
                      {item.nombre}
                    </span>
                    <span className="text-[10px] text-[#e3b341] font-[family-name:var(--font-pixelify)] shrink-0">
                      [{item.sku}]
                    </span>
                  </div>
                  <span className="text-[11px] text-white/50 block">
                    {item.categoria} · Stock: <strong className="text-white/80">{item.stockActual} u.</strong>
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-[family-name:var(--font-anton)] text-sm text-[#e3b341] block">
                  {formatCurrency(item.ingresosTotales)}
                </span>
                <span className="text-[10px] text-white/60 font-[family-name:var(--font-pixelify)]">
                  {item.unidadesVendidas} unidades
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/40 font-[family-name:var(--font-archivo)]">
        <span>Evaluado sobre 1.420 transacciones registradas</span>
        <span className="text-[#e3b341] font-[family-name:var(--font-pixelify)]">
          {viewMode === 'mas' ? 'ALTA DEMANDA' : 'ANALIZAR PROMOCIÓN'}
        </span>
      </div>
    </div>
  );
}
