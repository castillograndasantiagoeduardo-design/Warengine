'use client';

/**
 * PosCatalogo.tsx — Catálogo interactivo de productos y búsqueda rápida para el POS.
 */

import React, { useState, useEffect, useRef } from 'react';
import { posService } from '../api';
import type { ProductoPos } from '../types/pos.types';

interface PosCatalogoProps {
  onAgregarProducto: (producto: ProductoPos) => void;
  inputBuscarRef?: React.RefObject<HTMLInputElement | null>;
  /** Sede de la sesión: el stock mostrado es el de esta sucursal. */
  sucursalId: number;
  /** Cambia tras cada venta para recargar las existencias. */
  versionStock?: number;
}

export function PosCatalogo({ onAgregarProducto, inputBuscarRef, sucursalId, versionStock = 0 }: PosCatalogoProps) {
  const [query, setQuery] = useState<string>('');
  const [productos, setProductos] = useState<ProductoPos[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todas');

  const localInputRef = useRef<HTMLInputElement | null>(null);
  const searchRef = inputBuscarRef || localInputRef;

  const formatoCOP = (monto: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(monto);

  // Carga inicial y búsqueda con debounce
  useEffect(() => {
    let cancelado = false;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setErrorCarga(null);
      try {
        const data = await posService.buscarProductos(query, sucursalId);
        if (!cancelado) {
          setProductos(data);
        }
      } catch (err: unknown) {
        if (!cancelado) {
          setProductos([]);
          setErrorCarga(err instanceof Error ? err.message : 'No se pudo consultar el catálogo.');
        }
      } finally {
        if (!cancelado) setIsLoading(false);
      }
    }, 220);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [query, sucursalId, versionStock]);

  // Lista de categorías únicas extraídas de los productos
  const categorias = React.useMemo(() => {
    const cats = new Set<string>();
    productos.forEach((p) => {
      if (p.categoriaNombre) cats.add(p.categoriaNombre);
    });
    return Array.from(cats).sort((a, b) => a.localeCompare(b));
  }, [productos]);

  const tieneSinCategoria = React.useMemo(() => {
    return productos.some((p) => !p.categoriaNombre);
  }, [productos]);

  // Filtrado por categoría
  const productosFiltrados = React.useMemo(() => {
    if (categoriaSeleccionada === 'todas') return productos;
    if (categoriaSeleccionada === 'sin-categoria') {
      return productos.filter((p) => !p.categoriaNombre);
    }
    return productos.filter((p) => p.categoriaNombre === categoriaSeleccionada);
  }, [productos, categoriaSeleccionada]);

  // Manejo de lector de código de barras o Enter en el buscador
  const handleKeyDownBusqueda = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const limpio = query.trim().toLowerCase();
      if (!limpio) return;

      // Buscar coincidencia exacta por SKU primero (código de barras)
      const coincidenciaSku = productos.find(
        (p) => p.sku.toLowerCase() === limpio,
      );
      if (coincidenciaSku && coincidenciaSku.stockActual > 0) {
        onAgregarProducto(coincidenciaSku);
        setQuery('');
        return;
      }

      // O si hay solo 1 resultado visible, añadirlo
      if (productosFiltrados.length === 1 && productosFiltrados[0].stockActual > 0) {
        onAgregarProducto(productosFiltrados[0]);
        setQuery('');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a1124]/40 p-4">
      {/* Barra de Búsqueda y Filtro de Categorías */}
      <div className="mb-3 space-y-2">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm">
            🔍
          </span>
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownBusqueda}
            placeholder="Buscar por nombre o escanear código de barras / SKU (F2)..."
            className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-[#0f1b3d] border border-white/10 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-[#e3b341] transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/40 font-[family-name:var(--font-ui)]">
            F2
          </span>
        </div>

        {/* Chips de categorías */}
        {categorias.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button type="button"
              onClick={() => setCategoriaSeleccionada('todas')}
              className={`px-3 py-1 rounded-lg text-xs font-[family-name:var(--font-ui)] uppercase whitespace-nowrap cursor-pointer transition-all ${
                categoriaSeleccionada === 'todas'
                  ? 'bg-[#e3b341] text-black font-bold shadow-sm'
                  : 'bg-[#14213D] text-white/70 hover:text-white border border-white/5'
              }`}
            >
              Todos ({productos.length})
            </button>
            {categorias.map((cat) => (
              <button type="button"
                key={cat}
                onClick={() => setCategoriaSeleccionada(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-[family-name:var(--font-ui)] uppercase whitespace-nowrap cursor-pointer transition-all ${
                  categoriaSeleccionada === cat
                    ? 'bg-[#e3b341] text-black font-bold shadow-sm'
                    : 'bg-[#14213D] text-white/70 hover:text-white border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
            {tieneSinCategoria && (
              <button type="button"
                onClick={() => setCategoriaSeleccionada('sin-categoria')}
                className={`px-3 py-1 rounded-lg text-xs font-[family-name:var(--font-ui)] uppercase whitespace-nowrap cursor-pointer transition-all ${
                  categoriaSeleccionada === 'sin-categoria'
                    ? 'bg-amber-400 text-black font-bold shadow-sm'
                    : 'bg-[#14213D] text-amber-300/80 hover:text-amber-200 border border-amber-500/20'
                }`}
              >
                Sin Categoría
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid de productos */}
      <div className="flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-white/40 gap-2">
            <div className="w-6 h-6 border-2 border-[#e3b341] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-[family-name:var(--font-ui)]">Consultando catálogo...</span>
          </div>
        ) : errorCarga ? (
          <div className="h-64 flex flex-col items-center justify-center text-rose-200 border border-dashed border-rose-500/30 rounded-2xl p-6 text-center">
            <p className="text-sm font-medium">No se pudo cargar el catálogo</p>
            <p className="text-xs text-rose-200/70 mt-1">{errorCarga}</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-white/40 border border-dashed border-white/10 rounded-2xl p-6 text-center">
            <span className="text-3xl mb-2">📦</span>
            <p className="text-sm font-medium text-white/70">No se encontraron productos</p>
            <p className="text-xs text-white/40 mt-1">Intenta con otro término de búsqueda o SKU.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {productosFiltrados.map((prod) => {
              const agotado = prod.stockActual <= 0;
              return (
              <div
                key={prod.id}
                onClick={() => !agotado && onAgregarProducto(prod)}
                aria-disabled={agotado}
                title={agotado ? 'Sin existencias en esta sede' : undefined}
                className={`group relative p-3 rounded-2xl bg-[#0f1b3d] border border-white/10 flex flex-col justify-between transition-all duration-150 select-none shadow-md ${
                  agotado
                    ? 'opacity-45 cursor-not-allowed'
                    : 'hover:bg-[#15234d] hover:border-[#e3b341]/40 cursor-pointer active:scale-[0.98] hover:shadow-[#e3b341]/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-[family-name:var(--font-ui)] px-1.5 py-0.5 rounded bg-black/40 text-white/60 tracking-wider">
                      {prod.sku}
                    </span>
                    {prod.categoriaNombre && (
                      <span className="text-[9px] text-[#e3b341]/80 truncate max-w-[80px]">
                        {prod.categoriaNombre}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-white/90 group-hover:text-[#e3b341] line-clamp-2 leading-snug transition-colors">
                    {prod.nombre}
                  </h4>
                  <span className={`mt-1 block text-[10px] tabular-nums ${agotado ? 'text-rose-300' : 'text-white/50'}`}>
                    {agotado ? 'Agotado en esta sede' : `Stock: ${prod.stockActual}`}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-white/5 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-white/40 block leading-none">Precio</span>
                    <span className="font-[family-name:var(--font-anton)] text-[#e3b341] text-base tracking-wide">
                      {formatoCOP(prod.precioVenta)}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={agotado}
                    className="w-7 h-7 rounded-xl bg-[#e3b341]/20 group-hover:bg-[#e3b341] text-[#e3b341] group-hover:text-black flex items-center justify-center font-bold text-sm transition-colors shadow-sm"
                    title="Añadir al carrito"
                  >
                    +
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
