'use client';

/**
 * TarjetaActivos.tsx — Tarjeta compacta de estado del parque de activos fijos de la sede.
 *
 * Ancho completo:
 * 1. Cabecera con Título "Activos" + Badge de Total de Equipos.
 * 2. Barra horizontal fina segmentada (h-2 rounded-full) con los 4 estados y title nativo.
 * 3. Cuadrícula de 4 contadores ejecutivos (Disponible, Asignado, Mantenimiento, Baja)
 *    con recuadros de ícono de 32px, cifras tabulares y badges semánticos.
 */

import React, { useMemo } from 'react';
import { Tarjeta } from './Tarjeta';
import {
  CheckCircle2,
  UserCheck,
  Wrench,
  XCircle,
  PackageCheck,
} from 'lucide-react';
import { Insignia } from './Insignia';

export interface ResumenActivosSede {
  total: number;
  disponible: number;
  asignado: number;
  mantenimiento: number;
  baja: number;
}

export interface TarjetaActivosProps {
  resumen?: ResumenActivosSede;
  className?: string;
}

export function TarjetaActivos({
  resumen: resumenProp,
  className = '',
}: TarjetaActivosProps) {
  // Datos reales de la sede o respaldo si la BD está en blanco
  const data: ResumenActivosSede = useMemo(() => {
    if (resumenProp && resumenProp.total > 0) {
      return resumenProp;
    }
    // TODO: datos de respaldo de la especificación si aún no hay activos creados en BD
    return {
      total: 114,
      disponible: 42,
      asignado: 68,
      mantenimiento: 3,
      baja: 1,
    };
  }, [resumenProp]);

  const total = Math.max(1, data.total);
  const pDisp = Math.round((data.disponible / total) * 100);
  const pAsig = Math.round((data.asignado / total) * 100);
  const pMant = Math.round((data.mantenimiento / total) * 100);
  const pBaja = Math.max(0, 100 - pDisp - pAsig - pMant);

  const contadores = [
    {
      id: 'disponible',
      etiqueta: 'Disponible',
      estadoTexto: 'Operativo',
      cantidad: data.disponible,
      porcentaje: pDisp,
      variante: 'success' as const,
      colorBarra: '#15803d',
      icono: <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />,
      bgIcono: 'bg-green-100 dark:bg-green-500/15',
    },
    {
      id: 'asignado',
      etiqueta: 'Asignado',
      estadoTexto: 'En uso',
      cantidad: data.asignado,
      porcentaje: pAsig,
      variante: 'brand' as const,
      colorBarra: 'var(--p-500, #3b6cf2)',
      icono: <UserCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />,
      bgIcono: 'bg-brand-100 dark:bg-brand-500/15',
    },
    {
      id: 'mantenimiento',
      etiqueta: 'Mantenimiento',
      estadoTexto: 'En taller',
      cantidad: data.mantenimiento,
      porcentaje: pMant,
      variante: 'warning' as const,
      colorBarra: '#b45309',
      icono: <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      bgIcono: 'bg-amber-100 dark:bg-amber-500/15',
    },
    {
      id: 'baja',
      etiqueta: 'Baja',
      estadoTexto: 'Descarte',
      cantidad: data.baja,
      porcentaje: pBaja,
      variante: 'neutral' as const,
      colorBarra: '#64748b',
      icono: <XCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />,
      bgIcono: 'bg-slate-200 dark:bg-slate-500/15',
    },
  ];

  return (
    <Tarjeta
      titulo="Activos"
      className={`w-full ${className}`}
      accion={
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg superficie-control text-xs font-sans whitespace-nowrap">
          <span className="text-text-muted font-medium">Total:</span>
          <span className="font-semibold text-text tabular-nums">
            {data.total}
          </span>
          <span className="text-text-muted font-medium">equipos</span>
        </div>
      }
    >
      <div className="space-y-3 font-sans -my-1">
        {/* 2. Barra Segmentada Horizontal Fina (h-2 rounded-full) */}
      <div
        className="w-full h-2 rounded-full overflow-hidden flex superficie-control mb-4"
        title={`Disponible: ${data.disponible} (${pDisp}%) | Asignado: ${data.asignado} (${pAsig}%) | Mantenimiento: ${data.mantenimiento} (${pMant}%) | Baja: ${data.baja} (${pBaja}%)`}
      >
        <div
          style={{ width: `${pDisp}%`, backgroundColor: '#15803d' }}
          className="h-full transition-all duration-300"
        />
        <div
          style={{ width: `${pAsig}%`, backgroundColor: 'var(--p-500, #3b6cf2)' }}
          className="h-full transition-all duration-300"
        />
        <div
          style={{ width: `${pMant}%`, backgroundColor: '#b45309' }}
          className="h-full transition-all duration-300"
        />
        <div
          style={{ width: `${pBaja}%`, backgroundColor: '#64748b' }}
          className="h-full transition-all duration-300"
        />
      </div>

      {/* 3. Cuadrícula de 4 Contadores (1 sola fila en escritorio) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {contadores.map((c) => (
          <div
            key={c.id}
            className="superficie-control rounded-xl p-3 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.bgIcono}`}
              >
                {c.icono}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-sans font-medium text-text-muted block truncate">
                  {c.etiqueta}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-titulos font-semibold text-text tabular-nums leading-none">
                    {c.cantidad}
                  </span>
                  <span className="text-[11px] font-sans text-text-muted tabular-nums">
                    ({c.porcentaje} %)
                  </span>
                </div>
              </div>
            </div>

            <Insignia variante={c.variante} tamano="sm" className="hidden sm:inline-flex shrink-0">
              {c.estadoTexto}
            </Insignia>
          </div>
        ))}
      </div>
      </div>
    </Tarjeta>
  );
}

