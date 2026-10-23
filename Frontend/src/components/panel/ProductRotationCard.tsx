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
        orden: viewMode === 'mas' ? 'desc' : 'asc',
        limite: 4,
      });

      if (res.data) {
        setDbData(res.data);
      }
      setLoading(false);
    }

    loadRanking();
  }, [viewMode]);

  const defaultTop = [
    {
      productoId: 1,
      codigoSku: 'TAL-0941',
      nombreProducto: 'Taladro Percutor Industrial 850W',
      unidadesVendidas: 148,
      ingresosGenerados: 36260000,
    },
    {
      productoId: 2,
      codigoSku: 'DIS-2019',
      nombreProducto: 'Disco Diamantado 7 Pulgadas Concreto',
      unidadesVendidas: 320,
      ingresosGenerados: 17600000,
    },
    {
      productoId: 3,
      codigoSku: 'GEL-1044',
      nombreProducto: 'Guante de Seguridad Reforzado Nitrilo',
      unidadesVendidas: 540,
      ingresosGenerados: 13500000,
    },
    {
      productoId: 4,
      codigoSku: 'CAB-3301',
      nombreProducto: 'Cable Enchaquetado 3x12 AWG x 100m',
      unidadesVendidas: 84,
      ingresosGenerados: 12180000,
    },
  ];

  const defaultBaja = [
    {
      productoId: 5,
      codigoSku: 'SOL-8821',
      nombreProducto: 'Careta Fotosensible para Soldadura Pro',
      unidadesVendidas: 2,
      ingresosGenerados: 640000,
    },
    {
      productoId: 6,
      codigoSku: 'BOM-0023',
      nombreProducto: 'Bomba Sumergible Aguas Negras 1.5HP',
      unidadesVendidas: 1,
      ingresosGenerados: 1450000,
    },
    {
      productoId: 7,
      codigoSku: 'MAR-5510',
      nombreProducto: 'Martillo de Bronce Antichispa 2Lb',
      unidadesVendidas: 3,
      ingresosGenerados: 480000,
    },
    {
      productoId: 8,
      codigoSku: 'CAL-9011',
      nombreProducto: 'Calibrador Pie de Rey Digital 150mm',
      unidadesVendidas: 4,
      ingresosGenerados: 720000,
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
              ❄️ Baja Rotación
            </button>
          </div>
        </div>

        {/* Tabla / Lista de Productos */}
        <div className="mt-4 space-y-2.5">
          {currentList.map((item, idx) => (
            <div
              key={item.codigoSku}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between transition-colors gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-white/10 text-white/70 font-[family-name:var(--font-anton)] text-xs flex items-center justify-center shrink-0">
                  #{idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate font-[family-name:var(--font-archivo)]">
                      {item.nombreProducto}
                    </span>
                    <span className="text-[10px] text-[#e3b341] font-[family-name:var(--font-pixelify)] shrink-0">
                      [{item.codigoSku}]
                    </span>
                  </div>
                  <span className="text-[11px] text-white/50 block">
                    {Number(item.unidadesVendidas)} unidades despachadas
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-[family-name:var(--font-anton)] text-sm text-[#e3b341] block">
                  {formatCurrency(Number(item.ingresosGenerados))}
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
        <span>Fuente: Vista agregada de BD MySQL</span>
        <span className="text-[#e3b341] font-[family-name:var(--font-pixelify)]">
          {hasDbRows ? 'TRANSACCIONES REALES' : 'DEMO REFERENCIAL'}
        </span>
      </div>
    </div>
  );
}
