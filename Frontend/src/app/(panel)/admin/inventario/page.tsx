'use client';

import React, { useState } from 'react';
import { Button3D } from '@/components/ui/Button3D';

interface StockComparativo {
  sku: string;
  nombre: string;
  categoria: string;
  costoUnitario: number;
  precioVenta: number;
  stockSedes: {
    sedeCentral: number;
    sedeNorte: number;
    sedeOccidente: number;
  };
  totalStock: number;
  stockMinimo: number;
}

export default function InventarioAdminPage() {
  const [items] = useState<StockComparativo[]>([
    {
      sku: 'TAL-0941',
      nombre: 'Taladro Percutor Industrial 850W',
      categoria: 'Herramientas Eléctricas',
      costoUnitario: 145000,
      precioVenta: 245000,
      stockSedes: {
        sedeCentral: 18,
        sedeNorte: 10,
        sedeOccidente: 4,
      },
      totalStock: 32,
      stockMinimo: 15,
    },
    {
      sku: 'DIS-2019',
      nombre: 'Disco Diamantado 7" Concreto',
      categoria: 'Abrasivos',
      costoUnitario: 32000,
      precioVenta: 55000,
      stockSedes: {
        sedeCentral: 60,
        sedeNorte: 45,
        sedeOccidente: 9,
      },
      totalStock: 114,
      stockMinimo: 40,
    },
    {
      sku: 'MAR-1500',
      nombre: 'Martillo Neumático 1500W',
      categoria: 'Maquinaria',
      costoUnitario: 890000,
      precioVenta: 1450000,
      stockSedes: {
        sedeCentral: 0,
        sedeNorte: 0,
        sedeOccidente: 0,
      },
      totalStock: 0,
      stockMinimo: 5,
    },
    {
      sku: 'GEL-1044',
      nombre: 'Guante de Seguridad Reforzado Nitrilo',
      categoria: 'Seguridad Industrial',
      costoUnitario: 12000,
      precioVenta: 25000,
      stockSedes: {
        sedeCentral: 120,
        sedeNorte: 90,
        sedeOccidente: 30,
      },
      totalStock: 240,
      stockMinimo: 50,
    },
    {
      sku: 'CAB-3301',
      nombre: 'Cable Enchaquetado 3x12 AWG x 100m',
      categoria: 'Material Eléctrico',
      costoUnitario: 95000,
      precioVenta: 145000,
      stockSedes: {
        sedeCentral: 12,
        sedeNorte: 4,
        sedeOccidente: 2,
      },
      totalStock: 18,
      stockMinimo: 20,
    },
  ]);

  const [query, setQuery] = useState('');
  const [modalTransferOpen, setModalTransferOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockComparativo | null>(null);

  const filteredItems = items.filter(
    (i) =>
      i.nombre.toLowerCase().includes(query.toLowerCase()) ||
      i.sku.toLowerCase().includes(query.toLowerCase()) ||
      i.categoria.toLowerCase().includes(query.toLowerCase())
  );

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="space-y-6 select-none">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#121d3d] to-[#0c1326] border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e3b341] font-[family-name:var(--font-pixelify)]">
              CONTROL MULTI-ALMACÉN (RF-ADM-C4, RF-ADM-A6)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 font-[family-name:var(--font-archivo)]">
            Inventario Comparativo por Sucursal
          </h2>
          <p className="text-xs text-white/60 mt-0.5 font-[family-name:var(--font-archivo)]">
            Balance consolidado de existencias en tiempo real, costos de adquisición y traslados
          </p>
        </div>

        <Button3D
          onClick={() => {
            setSelectedItem(items[0]);
            setModalTransferOpen(true);
          }}
          className="text-xs py-2.5 px-4 self-start sm:self-auto"
        >
          ⇄ Traslado entre Sedes
        </Button3D>
      </div>

      {/* Buscador */}
      <div className="p-4 rounded-2xl bg-[#0f1733]/90 border border-white/10 flex items-center justify-between backdrop-blur-sm">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar por SKU, producto o categoría..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-[#e3b341] transition-all font-[family-name:var(--font-archivo)]"
          />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
            🔍
          </div>
        </div>

        <div className="text-xs text-[#e3b341] font-[family-name:var(--font-pixelify)] hidden sm:block">
          KARDEX APPEND-ONLY CONCILIADO
        </div>
      </div>

      {/* Tabla Comparativa de Inventario Multi-Sede */}
      <div className="rounded-2xl bg-[#0f1733]/90 border border-white/10 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-[family-name:var(--font-archivo)]">
            <thead className="bg-[#0b1228] text-white/50 text-[10px] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="p-4">SKU & Producto</th>
                <th className="p-4">Categoría</th>
                <th className="p-4 text-center">Sede Central</th>
                <th className="p-4 text-center">Suc. Norte</th>
                <th className="p-4 text-center">Suc. Occidente</th>
                <th className="p-4 text-center">Total Cadena</th>
                <th className="p-4 text-right">Precio Venta</th>
                <th className="p-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.map((item) => {
                const isCritico = item.totalStock <= item.stockMinimo;
                return (
                  <tr key={item.sku} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{item.nombre}</div>
                      <div className="text-[10px] font-mono text-[#e3b341] mt-0.5">
                        SKU: {item.sku}
                      </div>
                    </td>

                    <td className="p-4 text-white/70">{item.categoria}</td>

                    {/* Sede Central */}
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg font-bold font-[family-name:var(--font-pixelify)] ${
                          item.stockSedes.sedeCentral === 0
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-white/5 text-white'
                        }`}
                      >
                        {item.stockSedes.sedeCentral} u.
                      </span>
                    </td>

                    {/* Sede Norte */}
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg font-bold font-[family-name:var(--font-pixelify)] ${
                          item.stockSedes.sedeNorte === 0
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-white/5 text-white'
                        }`}
                      >
                        {item.stockSedes.sedeNorte} u.
                      </span>
                    </td>

                    {/* Sede Occidente */}
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg font-bold font-[family-name:var(--font-pixelify)] ${
                          item.stockSedes.sedeOccidente === 0
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-white/5 text-white'
                        }`}
                      >
                        {item.stockSedes.sedeOccidente} u.
                      </span>
                    </td>

                    {/* Total Cadena */}
                    <td className="p-4 text-center">
                      <div className="font-[family-name:var(--font-anton)] text-sm text-white">
                        {item.totalStock} u.
                      </div>
                      {isCritico && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-[family-name:var(--font-pixelify)] font-bold">
                          BAJO MÍNIMO ({item.stockMinimo})
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <span className="font-[family-name:var(--font-anton)] text-sm text-[#e3b341]">
                        {formatCurrency(item.precioVenta)}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setModalTransferOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#e3b341]/10 hover:bg-[#e3b341]/20 text-[#e3b341] border border-[#e3b341]/20 text-[11px] font-semibold cursor-pointer font-[family-name:var(--font-pixelify)]"
                      >
                        Trasladar ⇄
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-white/5 text-xs text-white/40 flex items-center justify-between font-[family-name:var(--font-archivo)]">
          <span>Mostrando balance consolidado en las 3 sedes comerciales</span>
          <span className="text-white/60 font-[family-name:var(--font-pixelify)]">
            VALUACIÓN A PRECIO DE COSTO ACTIVA
          </span>
        </div>
      </div>

      {/* Modal Traslado de Stock Inter-Sucursal */}
      {modalTransferOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0f1838] border border-white/20 rounded-2xl shadow-2xl p-6 select-none">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] text-[#e3b341] font-[family-name:var(--font-pixelify)]">
                  TRASLADO INTER-SUCURSAL (KARDEX)
                </span>
                <h3 className="text-base font-bold text-white font-[family-name:var(--font-archivo)]">
                  {selectedItem.nombre}
                </h3>
              </div>
              <button
                onClick={() => setModalTransferOpen(false)}
                className="text-white/40 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert(`Orden de traslado confirmada para ${selectedItem.nombre}. Se generó movimiento de salida en origen y entrada en destino en el Kardex.`);
                setModalTransferOpen(false);
              }}
              className="mt-4 space-y-3.5 text-xs font-[family-name:var(--font-archivo)]"
            >
              <div>
                <label className="text-white/70 block mb-1">Sucursal Origen (Salida de Stock)</label>
                <select className="w-full px-3 py-2 rounded-xl bg-[#121c3b] border border-white/15 text-white">
                  <option value="1">Sede Principal (Central) &mdash; {selectedItem.stockSedes.sedeCentral} u. disponibles</option>
                  <option value="2">Sucursal Norte &mdash; {selectedItem.stockSedes.sedeNorte} u. disponibles</option>
                  <option value="3">Sucursal Occidente &mdash; {selectedItem.stockSedes.sedeOccidente} u. disponibles</option>
                </select>
              </div>

              <div>
                <label className="text-white/70 block mb-1">Sucursal Destino (Entrada de Stock)</label>
                <select className="w-full px-3 py-2 rounded-xl bg-[#121c3b] border border-white/15 text-white" defaultValue="2">
                  <option value="1">Sede Principal (Central)</option>
                  <option value="2">Sucursal Norte</option>
                  <option value="3">Sucursal Occidente</option>
                </select>
              </div>

              <div>
                <label className="text-white/70 block mb-1">Cantidad de Unidades a Trasladar</label>
                <input
                  type="number"
                  min={1}
                  max={selectedItem.totalStock || 1}
                  defaultValue={5}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white"
                />
              </div>

              <div>
                <label className="text-white/70 block mb-1">Motivo / Guía de Transporte</label>
                <input
                  type="text"
                  placeholder="Ej: Reabastecimiento por stock crítico"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalTransferOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold cursor-pointer font-[family-name:var(--font-pixelify)]"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-3d text-xs py-2 px-5 font-bold">
                  Ejecutar Traslado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
