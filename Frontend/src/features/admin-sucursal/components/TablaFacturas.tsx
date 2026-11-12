'use client';

/**
 * TablaFacturas.tsx — Tabla compacta de comprobantes fiscales generados en POS y canal B2B.
 *
 * Cero scroll horizontal en resoluciones de 1280px y 1440px.
 * 4 columnas exactas (Consecutivo 26%, Cliente 40%, Total 18%, Estado 16%).
 * Altura de fila fija h-[52px], filtros segmentados y pie con total.
 */

import React, { useState, useMemo } from 'react';
import { ArrowRight, FileText } from 'lucide-react';
import { Insignia } from './Insignia';
import { formatCOP } from '@/lib/format/moneda';

export interface FacturaFila {
  id: string;
  consecutivo: string;
  fechaHora: string;
  clienteNombre: string;
  clienteIniciales: string;
  tipoCliente: 'B2B' | 'B2C';
  canalTexto: string;
  total: number;
  estado: 'emitida' | 'anulada';
}

export interface TablaFacturasProps {
  facturas?: FacturaFila[];
  onVerTodas?: () => void;
  onSeleccionarFactura?: (id: string) => void;
  className?: string;
}

type FiltroTab = 'todas' | 'emitidas' | 'anuladas' | 'b2b';

export function TablaFacturas({
  facturas: facturasProp,
  onVerTodas,
  onSeleccionarFactura,
  className = '',
}: TablaFacturasProps) {
  const [filtro, setFiltro] = useState<FiltroTab>('todas');

  // Datos reales o de respaldo si no hay facturas registradas aún
  const facturas: FacturaFila[] = useMemo(() => {
    if (facturasProp && facturasProp.length > 0) {
      return facturasProp;
    }
    // TODO: datos de respaldo de la especificación si no hay facturas en BD
    return [
      {
        id: 'fac-1',
        consecutivo: 'FAC-2026-0895',
        fechaHora: 'Hoy, 15:42',
        clienteNombre: 'Ferretería El Progreso S.A.S.',
        clienteIniciales: 'FP',
        tipoCliente: 'B2B',
        canalTexto: 'Crédito corporativo',
        total: 1850000,
        estado: 'emitida',
      },
      {
        id: 'fac-2',
        consecutivo: 'FAC-2026-0894',
        fechaHora: 'Hoy, 15:20',
        clienteNombre: 'Alejandro Morales Gómez',
        clienteIniciales: 'AM',
        tipoCliente: 'B2C',
        canalTexto: 'Venta mostrador POS',
        total: 94500,
        estado: 'emitida',
      },
      {
        id: 'fac-3',
        consecutivo: 'FAC-2026-0893',
        fechaHora: 'Hoy, 14:55',
        clienteNombre: 'Construcciones & Diseños Andina',
        clienteIniciales: 'CD',
        tipoCliente: 'B2B',
        canalTexto: 'Venta corporativa B2B',
        total: 3200000,
        estado: 'emitida',
      },
      {
        id: 'fac-4',
        consecutivo: 'FAC-2026-0892',
        fechaHora: 'Hoy, 14:38',
        clienteNombre: 'Mariana Restrepo Ruiz',
        clienteIniciales: 'MR',
        tipoCliente: 'B2C',
        canalTexto: 'Venta mostrador POS',
        total: 156000,
        estado: 'emitida',
      },
      {
        id: 'fac-5',
        consecutivo: 'FAC-2026-0891',
        fechaHora: 'Hoy, 14:23',
        clienteNombre: 'Distribuidora del Norte S.A.S.',
        clienteIniciales: 'DN',
        tipoCliente: 'B2B',
        canalTexto: 'Anulación de mostrador',
        total: 42000,
        estado: 'anulada',
      },
    ];
  }, [facturasProp]);

  const filtradas = useMemo(() => {
    return facturas.filter((f) => {
      if (filtro === 'emitidas') return f.estado === 'emitida';
      if (filtro === 'anuladas') return f.estado === 'anulada';
      if (filtro === 'b2b') return f.tipoCliente === 'B2B';
      return true;
    });
  }, [facturas, filtro]);

  const mostradas = filtradas.slice(0, 5);

  return (
    <div className={`vidrio p-5 sm:p-6 flex flex-col justify-between h-full ${className}`}>
      {/* 1. Cabecera con Título, Subtítulo y Filtros Segmentados */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-border">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-titulos font-semibold text-text tracking-normal truncate">
            Últimas facturas
          </h3>
          <p className="text-xs font-sans font-medium text-text-muted mt-0.5 truncate">
            Comprobantes fiscales generados en el mostrador POS y canal B2B
          </p>
        </div>

        {/* Filtros Segmentados */}
        <div className="flex items-center p-1 rounded-xl bg-surface border border-border text-xs shrink-0">
          {(
            [
              { id: 'todas', label: 'Todas' },
              { id: 'emitidas', label: 'Emitidas' },
              { id: 'anuladas', label: 'Anuladas' },
              { id: 'b2b', label: 'B2B' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFiltro(t.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filtro === t.id
                  ? 'bg-brand-600 text-btn-primario-texto shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Tabla sin Scroll Horizontal con 4 Columnas Exactas */}
      <div className="w-full overflow-hidden">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider font-medium text-text-muted">
              <th className="w-[26%] text-left py-2 px-2 font-medium">Consecutivo</th>
              <th className="w-[40%] text-left py-2 px-2 font-medium">Cliente</th>
              <th className="w-[18%] text-right py-2 px-2 font-medium">Total</th>
              <th className="w-[16%] text-right py-2 px-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {mostradas.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-xs text-text-muted">
                  No hay facturas que coincidan con este filtro.
                </td>
              </tr>
            ) : (
              mostradas.map((fac) => (
                <tr
                  key={fac.id}
                  onClick={() => onSeleccionarFactura?.(fac.id)}
                  className="h-[52px] hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  {/* Columna 1: Consecutivo (26%) */}
                  <td className="py-1.5 px-2 align-middle">
                    <div className="font-mono text-xs font-medium text-text group-hover:text-brand-400 transition-colors truncate">
                      {fac.consecutivo}
                    </div>
                    <div className="text-[11px] font-sans text-text-muted truncate">
                      {fac.fechaHora}
                    </div>
                  </td>

                  {/* Columna 2: Cliente (40%) */}
                  <td className="py-1.5 px-2 align-middle">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0 text-xs font-semibold text-text">
                        {fac.clienteIniciales}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-sans font-medium text-text text-xs truncate">
                          {fac.clienteNombre}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-text-muted mt-0.5 truncate">
                          <span className="font-mono font-medium px-1 rounded bg-white/[0.04] border border-border">
                            {fac.tipoCliente}
                          </span>
                          <span className="truncate">{fac.canalTexto}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Columna 3: Total (18%, derecha) */}
                  <td className="py-1.5 px-2 text-right align-middle">
                    <span className="font-sans font-semibold text-text text-xs sm:text-sm tabular-nums">
                      {formatCOP(fac.total)}
                    </span>
                  </td>

                  {/* Columna 4: Estado (16%, derecha) */}
                  <td className="py-1.5 px-2 text-right align-middle">
                    <div className="flex justify-end">
                      <Insignia
                        variante={fac.estado === 'emitida' ? 'success' : 'danger'}
                        tamano="sm"
                      >
                        {fac.estado === 'emitida' ? 'Emitida' : 'Anulada'}
                      </Insignia>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Pie de Tabla: Contador y Enlace */}
      <div className="flex items-center justify-between gap-3 pt-3 mt-2 border-t border-border/70 text-xs">
        <span className="text-text-muted font-sans tabular-nums">
          Mostrando {mostradas.length} de {filtradas.length} facturas
        </span>
        {onVerTodas && (
          <button
            type="button"
            onClick={onVerTodas}
            className="text-brand-400 hover:text-brand-300 font-sans font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Ver todas las facturas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

