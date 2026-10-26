'use client';

/**
 * CatalogoMultiBodega.tsx — Vista de catálogo expandido multi-bodega en modo solo lectura.
 *
 * Cumple con los requisitos del SRS:
 * - RF-FMC-C1: Catálogo expandido para ventas y cotizaciones.
 * - RF-FMC-C2: Filtros por categoría y disponibilidad.
 * - RF-FMC-C3: Indicador visual 'Solo Lectura' (sin controles de edición ni creación).
 * - RF-FMC-C6: Visualización prioritaria de precios corporativos autorizados.
 * - RF-FMC-C7: Botón de copiado de referencia / SKU al portapapeles.
 */

import React from 'react';
import type { ProductoResponse, FiltrosCatalogoB2B } from '../types';

interface CatalogoMultiBodegaProps {
  productos: ProductoResponse[];
  categorias: Array<{ id: number; nombre: string }>;
  filtros: FiltrosCatalogoB2B;
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosCatalogoB2B>>;
  isLoading: boolean;
  copiadoSku: string | null;
  onCopiarSku: (sku: string) => void;
  onAgregarAlCarrito: (producto: ProductoResponse) => void;
}

export function CatalogoMultiBodega({
  productos,
  categorias,
  filtros,
  setFiltros,
  isLoading,
  copiadoSku,
  onCopiarSku,
  onAgregarAlCarrito,
}: CatalogoMultiBodegaProps) {
  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Barra de Filtros y Modo Solo Lectura */}
      <div className="p-4 rounded-2xl bg-[#14213D] border border-white/10 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Buscador de texto */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por nombre o SKU corporativo..."
            value={filtros.texto}
            onChange={(e) => setFiltros((prev) => ({ ...prev, texto: e.target.value }))}
            className="w-full bg-[#0d1630] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#E9B949] transition-colors"
          />
          {filtros.texto && (
            <button
              onClick={() => setFiltros((prev) => ({ ...prev, texto: '' }))}
              className="absolute right-3 top-2.5 text-xs text-white/40 hover:text-white"
            >
              &times;
            </button>
          )}
        </div>

        {/* Selector de Categoría */}
        <select
          value={filtros.categoriaId || ''}
          onChange={(e) =>
            setFiltros((prev) => ({
              ...prev,
              categoriaId: e.target.value ? Number(e.target.value) : null,
            }))
          }
          className="bg-[#0d1630] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#E9B949] transition-colors cursor-pointer"
        >
          <option value="">Todas las Categorías</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>

        {/* Indicador Visual 'Solo Lectura' (RF-FMC-C3) */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] font-medium select-none">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          Modo Consulta (Solo Lectura)
        </div>
      </div>

      {/* Contenido del Catálogo */}
      {isLoading ? (
        <div className="p-12 text-center text-[#E9B949] text-xs font-mono bg-[#14213D] rounded-2xl border border-white/10">
          Cargando catálogo corporativo multi-bodega...
        </div>
      ) : productos.length === 0 ? (
        <div className="p-12 text-center text-white/50 text-xs bg-[#14213D] rounded-2xl border border-white/10">
          No se encontraron productos con los filtros seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {productos.map((prod) => {
            const tienePrecioCorp = prod.precioCorporativo && prod.precioCorporativo > 0;
            const precioVigente = tienePrecioCorp ? prod.precioCorporativo! : prod.precioVenta;

            return (
              <div
                key={prod.id}
                className="p-4 rounded-2xl bg-[#14213D] border border-white/10 hover:border-[#E9B949]/40 transition-all flex flex-col justify-between shadow-md"
              >
                <div>
                  {/* Fila superior: SKU y botón de copia */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[11px] text-white/60 bg-black/30 px-2 py-0.5 rounded-md">
                      {prod.sku}
                    </span>
                    <button
                      type="button"
                      onClick={() => onCopiarSku(prod.sku)}
                      title="Copiar SKU para cotización (RF-FMC-C7)"
                      className="text-[10px] text-[#E9B949] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      {copiadoSku === prod.sku ? '✓ Copiado' : 'Copiar SKU'}
                    </button>
                  </div>

                  {/* Nombre del producto */}
                  <h3 className="font-semibold text-sm text-white line-clamp-2 mb-2">
                    {prod.nombre}
                  </h3>
                </div>

                {/* Precios y Botón de Añadir */}
                <div className="pt-3 border-t border-white/10 mt-2">
                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <span className="text-[10px] text-white/50 block uppercase">
                        {tienePrecioCorp ? 'Precio Corporativo' : 'Precio Venta'}
                      </span>
                      <span className="text-base font-bold text-[#E9B949]">
                        ${precioVigente.toLocaleString('es-CO')}
                      </span>
                    </div>

                    {tienePrecioCorp && (
                      <span className="text-[10px] text-white/40 line-through">
                        ${prod.precioVenta.toLocaleString('es-CO')}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onAgregarAlCarrito(prod)}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-[#E9B949] to-[#b88a1f] hover:brightness-110 text-[#14213D] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow"
                  >
                    + Cotizar Ítem
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
