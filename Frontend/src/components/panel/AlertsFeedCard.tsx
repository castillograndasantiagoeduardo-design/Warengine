'use client';

import React, { useState } from 'react';

interface StockAlert {
  id: number;
  sucursal: string;
  producto: string;
  sku: string;
  stockActual: number;
  stockMinimo: number;
  prioridad: 'urgente' | 'normal';
  atendida: boolean;
}

export function AlertsFeedCard() {
  const [alerts, setAlerts] = useState<StockAlert[]>([
    {
      id: 1,
      sucursal: 'Sucursal Norte',
      producto: 'Martillo Neumático 1500W',
      sku: 'MAR-1500',
      stockActual: 0,
      stockMinimo: 10,
      prioridad: 'urgente',
      atendida: false,
    },
    {
      id: 2,
      sucursal: 'Sucursal Occidente',
      producto: 'Disco Corte Metal 4.5"',
      sku: 'DIS-4500',
      stockActual: 3,
      stockMinimo: 50,
      prioridad: 'urgente',
      atendida: false,
    },
    {
      id: 3,
      sucursal: 'Sede Principal (Central)',
      producto: 'Pintura Epóxica Gris Galón',
      sku: 'PIN-9021',
      stockActual: 8,
      stockMinimo: 20,
      prioridad: 'normal',
      atendida: false,
    },
    {
      id: 4,
      sucursal: 'Sucursal Norte',
      producto: 'Casco de Seguridad con Barbuquejo',
      sku: 'CAS-1002',
      stockActual: 5,
      stockMinimo: 30,
      prioridad: 'normal',
      atendida: false,
    },
  ]);

  const toggleAtendida = (id: number) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, atendida: !a.atendida } : a))
    );
  };

  return (
    <div className="p-5 rounded-2xl bg-[#0f1733]/90 border border-white/10 flex flex-col justify-between backdrop-blur-sm select-none">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div>
            <h2 className="text-sm font-bold text-white font-[family-name:var(--font-archivo)] uppercase tracking-wider">
              Alertas de Stock por Sucursal (RF-ADM-A6)
            </h2>
            <p className="text-xs text-white/50 mt-0.5 font-[family-name:var(--font-archivo)]">
              Monitoreo activo de agotamiento e inventario por debajo del mínimo de seguridad
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-[family-name:var(--font-pixelify)] font-bold">
            {alerts.filter((a) => !a.atendida).length} PENDIENTES
          </span>
        </div>

        {/* Lista de Alertas */}
        <div className="mt-4 space-y-2.5">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-xl border transition-all ${
                alert.atendida
                  ? 'bg-white/2 border-white/5 opacity-50'
                  : alert.prioridad === 'urgente'
                  ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40'
                  : 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase font-[family-name:var(--font-pixelify)] ${
                        alert.prioridad === 'urgente'
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-500 text-[#111111]'
                      }`}
                    >
                      {alert.prioridad === 'urgente' ? 'AGOTADO' : 'STOCK BAJO'}
                    </span>
                    <span className="text-xs font-semibold text-white truncate font-[family-name:var(--font-archivo)]">
                      {alert.producto}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/60 mt-1 font-[family-name:var(--font-archivo)]">
                    <span className="text-[#e3b341] font-[family-name:var(--font-pixelify)] font-medium">
                      {alert.sucursal}
                    </span>
                    <span>·</span>
                    <span>SKU: {alert.sku}</span>
                    <span>·</span>
                    <span>
                      Existencia: <strong className="text-rose-400">{alert.stockActual} u.</strong> / Mín: {alert.stockMinimo} u.
                    </span>
                  </div>
                </div>

                {/* Botón de Resolver / Atender */}
                <button
                  onClick={() => toggleAtendida(alert.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer font-[family-name:var(--font-pixelify)] shrink-0 ${
                    alert.atendida
                      ? 'bg-white/10 text-white/40 hover:bg-white/20'
                      : 'bg-[#e3b341] text-[#111111] hover:bg-[#f3c65c] shadow-sm'
                  }`}
                >
                  {alert.atendida ? 'Atendida ✓' : 'Atender'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/40 font-[family-name:var(--font-archivo)]">
        <span>Disparadores automáticos calculados cada 5 minutos</span>
        <span className="text-white/60 font-[family-name:var(--font-pixelify)]">
          KARDEX SYNCHRONIZED
        </span>
      </div>
    </div>
  );
}
