'use client';

/**
 * RegisterStockEntryModal.tsx — Modal para recepción y asentamiento de mercancía en sede (RF-ADM-B7).
 * 
 * Principio SOLID: Single Responsibility Principle (SRP).
 * Encapsula el formulario de entrada de stock con selección de proveedor, validaciones
 * y previsualización de saldo de inventario.
 */

import React, { useState, useEffect } from 'react';
import { Button3D } from '@/components/ui/Button3D';
import { PackageIcon, TruckIcon } from './Icons';
import type {
  ProductoInventarioSede,
  ProveedorInventario,
  RegistrarEntradaDTO,
} from '../types/branch-inventory.types';

interface RegisterStockEntryModalProps {
  isOpen: boolean;
  sucursalId: number;
  productos: ProductoInventarioSede[];
  proveedores: ProveedorInventario[];
  productoInicial?: ProductoInventarioSede | null;
  onClose: () => void;
  onRegistrar: (dto: RegistrarEntradaDTO) => Promise<{ ok: boolean; error?: string }>;
}

export function RegisterStockEntryModal({
  isOpen,
  sucursalId,
  productos,
  proveedores,
  productoInicial,
  onClose,
  onRegistrar,
}: RegisterStockEntryModalProps) {
  const [productoId, setProductoId] = useState('');
  const [proveedorId, setProveedorId] = useState<string>('');
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (productoInicial) {
        setProductoId(productoInicial.id);
        if (productoInicial.proveedorId) {
          setProveedorId(String(productoInicial.proveedorId));
        }
      } else if (productos.length > 0) {
        setProductoId(productos[0].id);
      }
      setCantidad('');
      setMotivo('');
      setErrorMsg(null);
    }
  }, [isOpen, productoInicial, productos]);

  if (!isOpen) return null;

  const productoSeleccionado = productos.find((p) => p.id === productoId);
  const stockActual = productoSeleccionado?.stockActual ?? 0;
  const cantNum = typeof cantidad === 'number' ? cantidad : 0;
  const stockProyectado = stockActual + cantNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!productoId) {
      setErrorMsg('Debes seleccionar un producto.');
      return;
    }

    if (!cantidad || cantidad <= 0) {
      setErrorMsg('La cantidad a ingresar debe ser mayor a 0 unidades.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onRegistrar({
        productoId,
        sucursalId,
        cantidad: Number(cantidad),
        proveedorId: proveedorId ? Number(proveedorId) : undefined,
        motivo: motivo.trim() || undefined,
      });

      if (res.ok) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al registrar la entrada.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="
          relative w-full max-w-lg overflow-hidden rounded-2xl
          bg-[#0d1630] border border-white/[0.12] shadow-2xl
          text-white font-[family-name:var(--font-archivo)]
        "
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#111d3f]/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
              <PackageIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold font-[family-name:var(--font-anton)] uppercase tracking-wide">
                Registrar Entrada de Mercancía
              </h2>
              <p className="text-xs text-slate-400">
                Suma existencias al almacén de la sucursal (RF-ADM-B7).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Selector de Producto */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Producto a Recibir *
            </label>
            <select
              value={productoId}
              onChange={(e) => {
                setProductoId(e.target.value);
                const found = productos.find((p) => p.id === e.target.value);
                if (found?.proveedorId) setProveedorId(String(found.proveedorId));
              }}
              className="w-full h-10 px-3 rounded-xl bg-[#09132b] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#e3b341]"
            >
              {productos.map((prod) => (
                <option key={prod.id} value={prod.id} className="bg-[#09132b] text-white">
                  {prod.sku} — {prod.nombre} (Stock actual: {prod.stockActual} unid.)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cantidad a Ingresar */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cantidad de Unidades *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Ej. 25"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value ? Number(e.target.value) : '')}
                required
                className="w-full h-10 px-3 rounded-xl bg-[#09132b] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#e3b341] font-mono"
              />
            </div>

            {/* Proveedor Comercial */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Proveedor Distribuidor
              </label>
              <select
                value={proveedorId}
                onChange={(e) => setProveedorId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#09132b] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#e3b341]"
              >
                <option value="" className="bg-[#09132b] text-slate-400">
                  Sin proveedor específico
                </option>
                {proveedores.map((prov) => (
                  <option key={prov.id} value={prov.id} className="bg-[#09132b] text-white">
                    {prov.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tarjeta de Cálculo de Stock Proyectado */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-slate-400">Proyección de existencias:</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-300">{stockActual} actuales</span>
              <span className="text-[#10b981] font-bold">+{cantNum}</span>
              <span className="text-slate-500">=</span>
              <span className="text-[#e3b341] font-bold text-sm bg-[#e3b341]/10 px-2 py-0.5 rounded-lg border border-[#e3b341]/25">
                {stockProyectado} unidades
              </span>
            </div>
          </div>

          {/* Motivo / Factura de Recepción */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Motivo u Observación (Factura / Remisión)
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Factura de compra FC-9821 / Reabastecimiento semanal"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#09132b] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#e3b341] resize-none"
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs rounded-xl border border-white/20 text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <Button3D
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="font-bold uppercase text-xs"
            >
              {isSubmitting ? 'Asentando Entrada...' : 'Asentar Entrada'}
            </Button3D>
          </div>
        </form>
      </div>
    </div>
  );
}
