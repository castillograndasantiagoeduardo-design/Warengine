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
import { Search, X, Copy, Check } from 'lucide-react';
import { Tarjeta } from '@/components/Tarjeta';
import { Insignia } from '@/components/Insignia';
import type { ProductoCatalogoB2B, FiltrosCatalogoB2B } from '../types';

interface CatalogoMultiBodegaProps {
  productos: ProductoCatalogoB2B[];
  categorias: Array<{ id: number; nombre: string }>;
  filtros: FiltrosCatalogoB2B;
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosCatalogoB2B>>;
  isLoading: boolean;
  copiadoSku: string | null;
  onCopiarSku: (sku: string) => void;
  onAgregarAlCarrito: (producto: ProductoCatalogoB2B) => void;
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
      <Tarjeta sinRelleno className="p-3.5 sm:p-4 hover:translate-y-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Buscador de texto */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU corporativo..."
              value={filtros.texto}
              onChange={(e) => setFiltros((prev) => ({ ...prev, texto: e.target.value }))}
              className="w-full superficie-control rounded-xl pl-9 pr-8 py-2 text-xs text-text placeholder-text-muted focus:outline-none transition-colors"
            />
            {filtros.texto && (
              <button
                type="button"
                onClick={() => setFiltros((prev) => ({ ...prev, texto: '' }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text p-1 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
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
            className="superficie-control rounded-xl px-3 py-2 text-xs text-text focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-bg text-text">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-bg text-text">
                {cat.nombre}
              </option>
            ))}
          </select>

          {/* Indicador Visual 'Solo Lectura' (RF-FMC-C3) */}
          <Insignia variante="info" conPunto tamano="md" className="shrink-0 select-none">
            Modo consulta (solo lectura)
          </Insignia>
        </div>
      </Tarjeta>

      {/* Contenido del Catálogo */}
      {isLoading ? (
        <Tarjeta sinRelleno className="p-12 text-center text-text-muted text-xs font-mono">
          Cargando catálogo corporativo multi-bodega...
        </Tarjeta>
      ) : productos.length === 0 ? (
        <Tarjeta sinRelleno className="p-12 text-center text-text-muted text-xs">
          No se encontraron productos con los filtros seleccionados.
        </Tarjeta>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {productos.map((prod) => {
            const tienePrecioCorp = prod.precioCorporativo && prod.precioCorporativo > 0;
            const precioVigente = tienePrecioCorp ? prod.precioCorporativo! : prod.precioVenta;
            const tieneStock = prod.stockSede > 0;

            return (
              <Tarjeta
                key={prod.id}
                sinRelleno
                className="p-4 flex flex-col justify-between"
              >
                <div>
                  {/* Fila superior: SKU y botón de copia */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[11px] text-text-muted superficie-control px-2 py-0.5 rounded-md">
                      {prod.sku}
                    </span>
                    <button
                      type="button"
                      onClick={() => onCopiarSku(prod.sku)}
                      title="Copiar SKU para cotización (RF-FMC-C7)"
                      className="text-[11px] font-sans font-medium text-brand-500 hover:text-brand-400 cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      {copiadoSku === prod.sku ? (
                        <>
                          <Check className="w-3 h-3 text-green-500" />
                          <span className="text-green-500">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar SKU</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Nombre del producto */}
                  <h3 className="font-titulos font-semibold text-sm text-text line-clamp-2 mb-2">
                    {prod.nombre}
                  </h3>

                  {/* Insignia de stock */}
                  <div className="mb-3">
                    <Insignia
                      variante={tieneStock ? 'neutral' : 'danger'}
                      conPunto
                      tamano="sm"
                    >
                      {tieneStock
                        ? `Stock en tu sede: ${prod.stockSede}`
                        : 'Sin existencias en tu sede'}
                    </Insignia>
                  </div>
                </div>

                {/* Precios y Botón de Añadir */}
                <div className="pt-3 border-t border-border mt-2">
                  <div className="flex items-baseline justify-between mb-2.5">
                    <div>
                      <span className="text-[10px] text-text-muted block font-medium">
                        {tienePrecioCorp ? 'Precio corporativo' : 'Precio venta'}
                      </span>
                      <span className="text-base font-titulos font-semibold text-text tabular-nums">
                        ${precioVigente.toLocaleString('es-CO')}
                      </span>
                    </div>

                    {tienePrecioCorp && (
                      <span className="text-xs text-text-muted line-through tabular-nums">
                        ${prod.precioVenta.toLocaleString('es-CO')}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onAgregarAlCarrito(prod)}
                    disabled={!tieneStock}
                    className="disabled:opacity-40 disabled:cursor-not-allowed w-full py-2 px-3 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-btn-primario-texto font-sans font-medium text-xs transition-all cursor-pointer shadow-sm shadow-brand-600/30 flex items-center justify-center gap-1.5"
                  >
                    <span>+ Cotizar ítem</span>
                  </button>
                </div>
              </Tarjeta>
            );
          })}
        </div>
      )}
    </div>
  );
}
