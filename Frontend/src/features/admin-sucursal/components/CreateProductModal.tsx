'use client';

/**
 * CreateProductModal.tsx — Modal para el registro rápido de producto en inventario.
 * Migrado a Modal.tsx para accesibilidad, scroll locking y diseño unificado.
 */

import React, { useState, useEffect } from 'react';
import { crearProductoSchema } from '@warengine/contracts';
import { Modal } from '@/components/ui/Modal';
import { apiClient, ApiError } from '@/lib/api';
import type { CategoriaInventario } from '../types/branch-inventory.types';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductoCreado?: () => void;
  /** Sede de la sesión del admin: el stock mínimo se configura en ella. */
  sucursalId: number;
  categorias?: CategoriaInventario[];
  categoriaPreseleccionadaId?: number | null;
}

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
  categorias = [],
  categoriaPreseleccionadaId,
}: CreateProductModalProps) {
  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | ''>('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioCorporativo, setPrecioCorporativo] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (categoriaPreseleccionadaId) {
      setCategoriaId(categoriaPreseleccionadaId);
    }
  }, [categoriaPreseleccionadaId]);

  const resetForm = () => {
    setSku('');
    setNombre('');
    setCategoriaId(categoriaPreseleccionadaId ?? '');
    setPrecioVenta('');
    setPrecioCompra('');
    setPrecioCorporativo('');
    setStockMinimo('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const parseado = crearProductoSchema.safeParse({
      sku: sku.trim(),
      nombre: nombre.trim(),
      categoriaId: categoriaId === '' ? undefined : Number(categoriaId),
      precioVenta: Number(precioVenta),
      precioCompra: aNumeroOpcional(precioCompra),
      precioCorporativo: aNumeroOpcional(precioCorporativo),
    });

    if (!parseado.success) {
      setErrorMsg(parseado.error.issues[0]?.message ?? 'Datos de producto inválidos');
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await apiClient.post<{ id?: string }>('/inventario/productos', parseado.data);
      const nuevoId = resp?.id;

      if (nuevoId && stockMinimo.trim() !== '') {
        const umbral = Number(stockMinimo);
        if (Number.isFinite(umbral) && umbral >= 0) {
          try {
            await apiClient.put('/inventario/stock-minimo', {
              productoId: nuevoId,
              sucursalId,
              stockMinimo: umbral,
            });
          } catch (err) {
            setErrorMsg(
              `Producto creado, pero no se pudo guardar el stock mínimo: ${mensajeDeError(err, 'error desconocido')}`,
            );
            onProductoCreado?.();
            return;
          }
        }
      }

      setSuccessMsg('Producto registrado exitosamente en el catálogo.');
      setTimeout(() => {
        onProductoCreado?.();
        handleClose();
      }, 700);
    } catch (err) {
      setErrorMsg(mensajeDeError(err, 'No se pudo registrar el producto.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Nuevo Producto"
      description="Alta inmediata de artículo en catálogo y umbrales de sede"
      size="lg"
      locked={isSubmitting}
      footer={
        <div className="flex gap-2 justify-end w-full">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-40 shadow-lg shadow-rose-500/20"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Código SKU / Barras *
            </label>
            <input
              type="text"
              placeholder="Ej. 7701234000011"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Nombre comercial *
            </label>
            <input
              type="text"
              placeholder="Ej. Arroz Diana 500g"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Precio Venta POS *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej. 4200"
              value={precioVenta}
              onChange={(e) => setPrecioVenta(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Precio Compra
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej. 3200"
              value={precioCompra}
              onChange={(e) => setPrecioCompra(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Precio B2B Corporativo
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Opcional"
              value={precioCorporativo}
              onChange={(e) => setPrecioCorporativo(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Categoría
            </label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value ? Number(e.target.value) : '')}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="">Sin categoría asignada</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Stock Mínimo (Umbral de alerta en sede)
            </label>
            <input
              type="number"
              min="0"
              placeholder="Ej. 15"
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
