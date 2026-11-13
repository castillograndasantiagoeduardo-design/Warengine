'use client';

/**
 * TarjetaKpi.tsx — Tarjeta métrica ejecutiva translúcida (.vidrio) para WarEngine.
 *
 * Implementación alineada con prueba-diseno-warengine (localhost:3005):
 * 1. Envuelve directamente al componente base <Tarjeta className="h-full">.
 * 2. Cero clases artificiales o pseudo-elementos duplicados (sin .vidrio-kpi).
 * 3. Fila superior fija (h-10) con etiqueta e ícono en recuadro redondeado.
 * 4. Fila central fija con cifra principal en font-titulos tabular-nums.
 * 5. Fila inferior con altura mínima reservada (min-h-[34px]) e Insignia semántica.
 */

import React from 'react';
import { Tarjeta } from './Tarjeta';
import { Insignia, type VarianteInsignia } from './Insignia';

export interface TarjetaKpiProps {
  // Soporta nomenclatura de WarEngine y de la prueba de diseño
  titulo?: string;
  etiqueta?: string;
  valor: string | number;
  icono?: React.ReactNode;
  badgeTexto?: string;
  variacion?: string;
  badgeVariante?: VarianteInsignia;
  estadoVariacion?: VarianteInsignia;
  badgeIcono?: React.ReactNode;
  conPunto?: boolean;
  textoSecundario?: string;
  periodo?: string;
  className?: string;
}

export const TarjetaKpi: React.FC<TarjetaKpiProps> = ({
  titulo,
  etiqueta,
  valor,
  icono,
  badgeTexto,
  variacion,
  badgeVariante,
  estadoVariacion = 'success',
  badgeIcono,
  conPunto = false,
  textoSecundario,
  periodo = 'vs. ayer',
  className = '',
}) => {
  const label = titulo || etiqueta || '';
  const badgeLabel = badgeTexto || variacion;
  const badgeVariant = badgeVariante || estadoVariacion;
  const secondaryText = textoSecundario || periodo;

  return (
    <Tarjeta className={`h-full ${className}`}>
      <div className="flex flex-col h-full">
        {/* 1. Fila superior con altura fija para alineación uniforme */}
        <div className="h-10 flex items-start justify-between gap-3 shrink-0">
          <p className="text-sm font-sans font-medium text-text-muted leading-snug line-clamp-2">
            {label}
          </p>
          {icono && (
            <div className="w-10 h-10 rounded-xl bg-brand-100 border border-brand-200 text-brand-700 dark:bg-brand-500/15 dark:border-brand-400/20 dark:text-brand-300 flex items-center justify-center shrink-0">
              {icono}
            </div>
          )}
        </div>

        {/* 2. Cifra central en posición fija y alineada en todas las tarjetas */}
        <div className="mt-2.5 mb-1 shrink-0">
          <p className="text-3xl font-titulos font-semibold tracking-[-0.005em] text-text tabular-nums leading-none">
            {valor}
          </p>
        </div>

        {/* 3. Fila inferior con altura mínima reservada (min-h-[34px]) */}
        <div className="mt-auto pt-2 min-h-[34px] flex flex-col justify-end">
          {badgeLabel && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-sans">
              <Insignia
                variante={badgeVariant}
                icono={badgeIcono}
                conPunto={conPunto}
                tamano="sm"
                className="tabular-nums whitespace-nowrap shrink-0"
              >
                {badgeLabel}
              </Insignia>
              {secondaryText && (
                <span className="text-xs font-sans font-medium text-text-muted leading-tight">
                  {secondaryText}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Tarjeta>
  );
};
