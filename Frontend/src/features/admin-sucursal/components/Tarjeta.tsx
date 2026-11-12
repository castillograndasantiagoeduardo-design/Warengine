'use client';

/**
 * Tarjeta.tsx — Contenedor oficial en vidrio translúcido (.vidrio) para WarEngine.
 *
 * Incluye elevación hover, bisel superior especular y cabecera estándar con
 * títulos en Plus Jakarta Sans (font-titulos), subtítulos en Inter (font-sans)
 * y slot de acción a la derecha.
 */

import React from 'react';

export interface TarjetaProps {
  children: React.ReactNode;
  titulo?: React.ReactNode;
  subtitulo?: React.ReactNode;
  accion?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Tarjeta({
  children,
  titulo,
  subtitulo,
  accion,
  className = '',
  bodyClassName = 'p-5 sm:p-6',
}: TarjetaProps) {
  const tieneCabecera = Boolean(titulo || subtitulo || accion);

  return (
    <div className={`vidrio overflow-hidden ${className}`}>
      {tieneCabecera && (
        <div className="px-5 sm:px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {titulo && (
              <h3 className="text-base font-titulos font-semibold text-text tracking-normal truncate">
                {titulo}
              </h3>
            )}
            {subtitulo && (
              <p className="text-xs font-sans font-medium text-text-muted mt-0.5 truncate">
                {subtitulo}
              </p>
            )}
          </div>
          {accion && <div className="shrink-0">{accion}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

