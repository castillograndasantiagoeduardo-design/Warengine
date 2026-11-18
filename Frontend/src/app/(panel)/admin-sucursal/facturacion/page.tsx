'use client';

/**
 * /admin-sucursal/facturacion — Pestaña de Supervisión de Facturas.
 *
 * Sincroniza todos los filtros y paginación en la URL con useSearchParams / useRouter.
 * Paginación server-side, debounced search, modal de anulación y modal de devolución.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useBranchInvoicing } from '@/features/admin-sucursal/hooks/useBranchInvoicing';
import {
  FacturasFilterBar,
  FacturasTable,
} from '@/features/admin-sucursal/components/invoicing';
import {
  Pagination,
  LoadingState,
  EmptyState,
  ErrorState,
} from '@/features/admin-sucursal/components/shared';
import {
  InvoiceDetailModal,
  VoidInvoiceModal,
  ReturnInvoiceModal,
} from '@/features/admin-sucursal/components';
import type {
  FacturaSede,
  EstadoFacturaSede,
} from '@/features/admin-sucursal/types/branch-invoicing.types';

function getFechasDefault() {
  const hoy = new Date();
  const hace7Dias = new Date();
  hace7Dias.setDate(hace7Dias.getDate() - 7);
  return {
    desde: hace7Dias.toISOString().slice(0, 10),
    hasta: hoy.toISOString().slice(0, 10),
  };
}

export default function FacturasPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fechasDef = useMemo(() => getFechasDefault(), []);

  // 1. Leer estado desde searchParams de la URL
  const texto = searchParams.get('texto') || '';
  const estado = (searchParams.get('estado') as EstadoFacturaSede | 'todas') || 'todas';
  const tipo = (searchParams.get('tipo') as 'POS' | 'B2B' | 'todos') || 'todos';
  const desde = searchParams.get('desde') || fechasDef.desde;
  const hasta = searchParams.get('hasta') || fechasDef.hasta;
  const page = parseInt(searchParams.get('page') || '1', 10) || 1;

  // 2. Función para actualizar la URL de forma sincronizada
  const actualizarUrl = useCallback(
    (cambios: Record<string, string | number | undefined | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(cambios).forEach(([key, val]) => {
        if (val === undefined || val === null || val === '' || val === 'todas' || val === 'todos') {
          params.delete(key);
        } else {
          params.set(key, String(val));
        }
      });

      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const filtrosParaHook = useMemo(
    () => ({
      texto,
      estado,
      tipo,
      desde,
      hasta,
      page,
      limite: 10,
    }),
    [texto, estado, tipo, desde, hasta, page],
  );

  // 3. Consumo de servicio de backend mediante useBranchInvoicing
  const {
    datos,
    total,
    totalPaginas,
    cargando,
    error,
    recargar,
    anularFactura,
    registrarDevolucion,
  } = useBranchInvoicing(filtrosParaHook);

  // 4. Estados de modales
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [facturaParaAnular, setFacturaParaAnular] = useState<FacturaSede | null>(null);
  const [facturaParaDevolver, setFacturaParaDevolver] = useState<FacturaSede | null>(null);

  const handleFiltrosChange = (nuevos: {
    texto?: string;
    estado?: EstadoFacturaSede | 'todas';
    tipo?: 'POS' | 'B2B' | 'todos';
    desde?: string;
    hasta?: string;
  }) => {
    actualizarUrl({ ...nuevos, page: 1 });
  };

  const handleLimpiarFiltros = () => {
    actualizarUrl({
      texto: undefined,
      estado: undefined,
      tipo: undefined,
      desde: fechasDef.desde,
      hasta: fechasDef.hasta,
      page: 1,
    });
  };

  const handlePageChange = (newPage: number) => {
    actualizarUrl({ page: newPage });
  };

  const handleVerDetalle = (id: string) => {
    setDetalleId(id);
  };

  const handleOpenAnular = (f: FacturaSede) => {
    setFacturaParaAnular(f);
  };

  const handleOpenDevolucion = (f: FacturaSede) => {
    setFacturaParaDevolver(f);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <FacturasFilterBar
        valores={{ texto, estado, tipo, desde, hasta }}
        onChange={handleFiltrosChange}
        onLimpiar={handleLimpiarFiltros}
        disabled={cargando}
      />

      {/* Contenido Principal */}
      {cargando ? (
        <LoadingState title="Cargando facturas de la sucursal..." />
      ) : error ? (
        <ErrorState
          title="Error al cargar facturas"
          message={error}
          onRetry={recargar}
        />
      ) : datos.length === 0 ? (
        <EmptyState
          title="No se encontraron comprobantes"
          description="No hay facturas que coincidan con los filtros de búsqueda o fechas seleccionadas."
          action={
            <button
              type="button"
              onClick={handleLimpiarFiltros}
              className="px-3 py-1.5 rounded-lg border border-white/20 text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-xs font-semibold cursor-pointer"
            >
              Limpiar filtros
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          <FacturasTable facturas={datos} onVerDetalle={handleVerDetalle} />
          <Pagination
            page={page}
            totalPages={totalPaginas}
            total={total}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Modal de Detalle */}
      <InvoiceDetailModal
        isOpen={Boolean(detalleId)}
        facturaId={detalleId}
        onClose={() => setDetalleId(null)}
        onAnularClick={(f) => {
          setDetalleId(null);
          handleOpenAnular(f);
        }}
        onDevolucionClick={(f) => {
          setDetalleId(null);
          handleOpenDevolucion(f);
        }}
      />

      {/* Modal de Anulación */}
      <VoidInvoiceModal
        isOpen={Boolean(facturaParaAnular)}
        factura={facturaParaAnular}
        onClose={() => setFacturaParaAnular(null)}
        onAnular={anularFactura}
        onSuccess={() => {
          recargar();
        }}
      />

      {/* Modal de Devolución */}
      <ReturnInvoiceModal
        open={Boolean(facturaParaDevolver)}
        factura={facturaParaDevolver}
        onClose={() => setFacturaParaDevolver(null)}
        onRegistrarDevolucion={registrarDevolucion}
        onSuccess={() => {
          recargar();
        }}
      />
    </div>
  );
}
