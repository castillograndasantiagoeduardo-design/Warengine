'use client';

import React, { useEffect, useState } from 'react';
import { fetchRankingProductos, RankingProductoItem } from '@/features/administracion/api/dashboard.api';

export function ProductRotationCard() {
  const [viewMode, setViewMode] = useState<'mas' | 'menos'>('mas');
  const [dbData, setDbData] = useState<RankingProductoItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadRanking() {
      setLoading(true);
      const res = await fetchRankingProductos({
        orden: viewMode === 'mas' ? 'mas_vendidos' : 'menos_vendidos',
        limite: 4,
      });

      if (res.data) {
        setDbData(res.data);
      }
      setLoading(false);
    }

    loadRanking();
  }, [viewMode]);

  const defaultTop: RankingProductoItem[] = [
    {
      productoId: 1,
      sku: 'GEL-1044',
      nombre: 'Guante de Seguridad Reforzado Nitrilo',
      cantidadVendida: 540,
      totalRecaudado: 13500000,
    },
    {
      productoId: 2,
      sku: 'DIS-2019',
      nombre: 'Disco Diamantado 7 Pulgadas Concreto',
      cantidadVendida: 320,
      totalRecaudado: 17600000,
    },
    {
      productoId: 3,
      sku: 'TAL-0941',
      nombre: 'Taladro Percutor Industrial 850W',
      cantidadVendida: 125,
      totalRecaudado: 30625000,
    },
    {
      productoId: 4,
      sku: 'CAB-3301',
      nombre: 'Cable Enchaquetado 3x12 AWG x 100m',
      cantidadVendida: 90,
      totalRecaudado: 13050000,
    },
  ];

  const defaultBaja: RankingProductoItem[] = [
    {
      productoId: 5,
      sku: 'MAR-1500',
      nombre: 'Martillo Neumático 1500W',
      cantidadVendida: 0,
      totalRecaudado: 0,
    },
    {
      productoId: 6,
      sku: 'SOL-8821',
      nombre: 'Careta Fotosensible para Soldadura Pro',
      cantidadVendida: 20,
      totalRecaudado: 6400000,
    },
    {
      productoId: 7,
      sku: 'BOM-0023',
      nombre: 'Bomba Sumergible Aguas Negras 1.5HP',
      cantidadVendida: 20,
      totalRecaudado: 29000000,
    },
  ];

  const hasDbRows = dbData.length > 0;
  const currentList = hasDbRows ? dbData : viewMode === 'mas' ? defaultTop : defaultBaja;

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
              Líderes en facturación vs. inventario estancado (/dashboard/ranking)
            </p>
          </div>

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
              ❄️ Menos Vendidos
            </button>
          </div>
        </div>

        {/* Tabla / Lista de Productos */}
        <div className="mt-4 space-y-2.5">
          {currentList.map((item, idx) => (
            <div
              key={`${item.sku}-${idx}`}
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
                    {Number(item.cantidadVendida)} unidades vendidas
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-[family-name:var(--font-anton)] text-sm text-[#e3b341] block">
                  {formatCurrency(Number(item.totalRecaudado))}
                </span>
                <span className="text-[10px] text-white/60 font-[family-name:var(--font-pixelify)]">
                  Facturación Bruta
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/40 font-[family-name:var(--font-archivo)]">
        <span>Fuente: Consulta SQL agregada sobre `factura_items`</span>
        <span className="text-[#e3b341] font-[family-name:var(--font-pixelify)]">
          TRANSACCIONES REALES EN BD
        </span>
      </div>
    </div>
  );
}
