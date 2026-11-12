'use client';

/**
 * TarjetaKpi.tsx — Tarjeta métrica ejecutiva alineada en 3 niveles estrictos.
 *
 * 1. Fila superior fija (h-10): etiqueta en font-sans font-medium text-text-muted
 *    e ícono en recuadro w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300.
 * 2. Fila central: cifra principal en text-3xl font-titulos font-semibold tracking-[-0.005em] tabular-nums.
 * 3. Fila inferior fija (min-h-[34px]): Insignia semántica de variación + texto secundario.
 */

import React from 'react';
import { Insignia, type VarianteInsignia } from './Insignia';

export interface TarjetaKpiProps {
  titulo: string;
  valor: string | number;
  icono: React.ReactNode;
  badgeTexto?: string;
  badgeVariante?: VarianteInsignia;
  badgeIcono?: React.ReactNode;
  conPunto?: boolean;
  textoSecundario?: string;
  className?: string;
}

export function TarjetaKpi({
  titulo,
  valor,
  icono,
  badgeTexto,
  badgeVariante = 'success',
  badgeIcono,
  conPunto = false,
  textoSecundario,
  className = '',
}: TarjetaKpiProps) {
  return (
    <div
      className={`vidrio p-5 sm:p-6 flex flex-col justify-between h-full ${className}`}
    >
      {/* Nivel 1: Fila Superior Fija (h-10) */}
      <div className="h-10 flex items-center justify-between gap-3 mb-3">
        <span className="text-sm font-sans font-medium text-text-muted truncate">
          {titulo}
        </span>
        <div className="w-9 h-9 rounded-xl bg-surface border border-border text-brand-400 flex items-center justify-center shrink-0">
          {icono}
        </div>
      </div>

      {/* Nivel 2: Cifra Central */}
      <div className="my-1">
        <span className="text-3xl font-titulos font-semibold tracking-[-0.005em] text-text tabular-nums leading-none block truncate">
          {valor}
        </span>
      </div>

      {/* Nivel 3: Fila Inferior con Altura Mínima Garantizada (min-h-[34px]) */}
      <div className="min-h-[34px] flex flex-wrap items-center gap-2 pt-2 mt-1">
        {badgeTexto && (
          <Insignia
            variante={badgeVariante}
            icono={badgeIcono}
            conPunto={conPunto}
            tamano="sm"
          >
            {badgeTexto}
          </Insignia>
        )}
        {textoSecundario && (
          <span className="text-xs font-sans text-text-muted truncate">
            {textoSecundario}
          </span>
        )}
      </div>
    </div>
  );
}

