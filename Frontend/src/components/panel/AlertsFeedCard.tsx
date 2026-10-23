'use client';

import React, { useEffect, useState } from 'react';
import { fetchAlertasStock, AlertaStockItem } from '@/features/administracion/api/alertas.api';

export function AlertsFeedCard() {
  const [dbAlerts, setDbAlerts] = useState<AlertaStockItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAlerts() {
      setLoading(true);
      const res = await fetchAlertasStock();
      if (res.data && res.data.items) {
        setDbAlerts(res.data.items);
      }
      setLoading(false);
    }
    loadAlerts();
  }, []);

  const defaultFallback: AlertaStockItem[] = [
    {
      productoId: '101',
      sucursalId: 2,
      sucursalNombre: 'Sucursal Norte',
      nombre: 'Martillo Neumático 1500W',
      sku: 'MAR-1500',
      stockActual: 0,
      stockMinimo: 10,
      faltante: 10,
    },
    {
      productoId: '102',
      sucursalId: 3,
      sucursalNombre: 'Sucursal Occidente',
      nombre: 'Disco Corte Metal 4.5"',
      sku: 'DIS-4500',
      stockActual: 3,
      stockMinimo: 50,
      faltante: 47,
    },
    {
      productoId: '103',
      sucursalId: 1,
      sucursalNombre: 'Sede Principal (Central)',
      nombre: 'Pintura Epóxica Gris Galón',
      sku: 'PIN-9021',
      stockActual: 8,
      stockMinimo: 20,
      faltante: 12,
    },
  ];

  const hasDbRows = dbAlerts.length > 0;
  const alerts = hasDbRows ? dbAlerts : defaultFallback;

  return (
    <div className="p-5 rounded-2xl bg-[#0f1733]/90 border border-white/10 flex flex-col justify-between backdrop-blur-sm select-none">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div>
            <h2 className="text-sm font-bold text-white font-[family-name:var(--font-archivo)] uppercase tracking-wider">
              Alertas de Stock por Sucursal (RF-ADM-A6)
            </h2>
            <p className="text-xs text-white/50 mt-0.5 font-[family-name:var(--font-archivo)]">
              Monitoreo de agotamiento en tiempo real (/administracion/alertas-stock)
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-[family-name:var(--font-pixelify)] font-bold">
            {alerts.length} CRÍTICAS
          </span>
        </div>

        {/* Lista de Alertas */}
        <div className="mt-4 space-y-2.5 max-h-72 overflow-y-auto">
          {alerts.map((alert, idx) => {
            const esAgotado = alert.stockActual === 0;
            return (
              <div
                key={`${alert.sku}-${alert.sucursalId}-${idx}`}
                className={`p-3 rounded-xl border transition-all ${
                  esAgotado
                    ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40'
                    : 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase font-[family-name:var(--font-pixelify)] ${
                          esAgotado ? 'bg-rose-500 text-white' : 'bg-amber-500 text-[#111111]'
                        }`}
                      >
                        {esAgotado ? 'AGOTADO' : 'STOCK BAJO'}
                      </span>
                      <span className="text-xs font-semibold text-white truncate font-[family-name:var(--font-archivo)]">
                        {alert.nombre}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-white/60 mt-1 font-[family-name:var(--font-archivo)]">
                      <span className="text-[#e3b341] font-[family-name:var(--font-pixelify)] font-medium">
                        {alert.sucursalNombre}
                      </span>
                      <span>·</span>
                      <span>SKU: {alert.sku}</span>
                      <span>·</span>
                      <span>
                        Stock: <strong className="text-rose-400">{alert.stockActual} u.</strong> / Mín: {alert.stockMinimo} u. (Faltan {alert.faltante} u.)
                      </span>
                    </div>
                  </div>

                  <a
                    href="/admin/inventario"
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer font-[family-name:var(--font-pixelify)] shrink-0 bg-[#e3b341] text-[#111111] hover:bg-[#f3c65c] shadow-sm"
                  >
                    Trasladar &rarr;
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/40 font-[family-name:var(--font-archivo)]">
        <span>Evaluado contra Kardex de movimientos</span>
        <span className="text-white/60 font-[family-name:var(--font-pixelify)]">
          {hasDbRows ? 'DESDE BD MYSQL' : 'MODO REFERENCIA'}
        </span>
      </div>
    </div>
  );
}
