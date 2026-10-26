'use client';

/**
 * CreateProductModal.tsx — Modal para el registro rápido de producto en inventario.
 *
 * Principio SOLID: Single Responsibility Principle (SRP).
 * Encapsula el formulario de alta de producto con validaciones de frontera,
 * estética Glassmorphism y botón táctil mecánico 3D en oro WarEngine.
 */

import React, { useState } from 'react';
import { crearProductoSchema } from '@warengine/contracts';
import { Button3D } from '@/components/ui/Button3D';
import { apiClient, ApiError } from '@/lib/api';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductoCreado?: () => void;
  /** Sede de la sesión del admin: el stock mínimo se configura en ella. */
  sucursalId: number;
}

/** Mensaje legible de un error de la API (incluye la primera validación de Zod si la hay). */
function mensajeDeError(err: unknown, porDefecto: string): string {
  if (err instanceof ApiError) {
    return err.issues?.[0]?.message ?? err.message ?? porDefecto;
  }
  return err instanceof Error ? err.message : porDefecto;
}

const aNumeroOpcional = (valor: string) => (valor.trim() === '' ? undefined : Number(valor));

export function CreateProductModal({
  isOpen,
  onClose,
  onProductoCreado,
  sucursalId,
}: CreateProductModalProps) {
  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioCorporativo, setPrecioCorporativo] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Mismo contrato que valida la API (categoría y proveedor son opcionales)
    const parsed = crearProductoSchema.safeParse({
      sku: sku.trim().toUpperCase(),
      nombre: nombre.trim(),
      precioCompra: aNumeroOpcional(precioCompra),
      precioVenta: aNumeroOpcional(precioVenta),
      precioCorporativo: aNumeroOpcional(precioCorporativo) ?? null,
    });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? 'Revisa los datos del producto.');
      return;
    }

    const sMin = aNumeroOpcional(stockMinimo);
    if (sMin !== undefined && (!Number.isInteger(sMin) || sMin < 0)) {
      setErrorMsg('El stock mínimo debe ser un número entero mayor o igual a 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const creado = await apiClient.post<{ id: string }>('/inventario/productos', parsed.data);

      // El umbral se guarda por sede con su propio endpoint (el alta de producto es global)
      if (sMin !== undefined) {
        try {
          await apiClient.put('/inventario/stock-minimo', {
            productoId: creado.id,
            sucursalId,
            stockMinimo: sMin,
          });
        } catch (err) {
          setErrorMsg(
            `Producto creado, pero no se pudo guardar el stock mínimo: ${mensajeDeError(err, 'error desconocido')}`,
          );
          onProductoCreado?.();
          return;
        }
      }

      setSuccessMsg('Producto registrado en el catálogo.');
      setTimeout(() => {
        onProductoCreado?.();
        onClose();
      }, 900);
    } catch (err) {
      setErrorMsg(mensajeDeError(err, 'No se pudo registrar el producto.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity duration-200"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#0d1630] border border-white/[0.12] p-6 shadow-2xl text-slate-100 font-[family-name:var(--font-archivo)]">
        {/* Luz difusa superior */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#e3b341]/40 to-transparent" />

        {/* Encabezado */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
          <div>
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-anton)] uppercase tracking-wider">
              Nuevo Producto
            </h2>
            <p className="text-xs text-slate-400">
              Alta inmediata de artículo en inventario de la sede
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer text-lg"
          >
            &times;
          </button>
        </div>

        {/* Notificaciones de Feedback */}
        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-[#10b981]/10 border border-[#10b981]/25 text-[#10b981] text-xs">
            {successMsg}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Código SKU *
              </label>
              <input
                type="text"
                placeholder="Ej. HER-045"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white focus:outline-none focus:border-[#e3b341]/60 font-mono text-xs uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Precio Venta (COP) *
              </label>
              <input
                type="number"
                placeholder="Ej. 185000"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white focus:outline-none focus:border-[#e3b341]/60 font-mono text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Precio Compra (COP) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej. 120000"
                value={precioCompra}
                onChange={(e) => setPrecioCompra(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white focus:outline-none focus:border-[#e3b341]/60 font-mono text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Precio Corporativo B2B
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Opcional"
                value={precioCorporativo}
                onChange={(e) => setPrecioCorporativo(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white focus:outline-none focus:border-[#e3b341]/60 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              placeholder="Ej. Taladro Percutor Industrial 1/2”"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white focus:outline-none focus:border-[#e3b341]/60 text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Stock Mínimo de Sede (Umbral de alerta)
            </label>
            <input
              type="number"
              min="0"
              placeholder="Opcional (ej. 5)"
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white focus:outline-none focus:border-[#e3b341]/60 font-mono text-xs"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Las existencias iniciales se ingresan formalmente desde &quot;Registrar Entrada&quot; con factura o remisión de proveedor.
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08] mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <Button3D
              size="sm"
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer font-bold"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
            </Button3D>
          </div>
        </form>
      </div>
    </div>
  );
}
