'use client';

/**
 * Tarjeta.tsx — Contenedor oficial en vidrio translúcido (.vidrio) para WarEngine.
 *
 * Implementación oficial idéntica al proyecto de prueba (localhost:3005):
 * - Estilo translúcido con clase .vidrio (backdrop-filter blur 20px, borde 1px translúcido, sombra suave).
 * - Borde superior especular mediante .vidrio::before con --kpi-glow-opacity.
 * - Sin capas opacas internas que bloqueen la retícula o el fondo ambiental.
 */

import React from 'react';

export interface TarjetaProps extends React.HTMLAttributes<HTMLDivElement> {
  titulo?: React.ReactNode;
  subtitulo?: React.ReactNode;
  accion?: React.ReactNode;
  sinRelleno?: boolean;
  children: React.ReactNode;
  bodyClassName?: string;
}

export const Tarjeta: React.FC<TarjetaProps> = ({
  titulo,
  subtitulo,
  accion,
  sinRelleno = false,
  className = '',
  bodyClassName,
  children,
  ...props
}) => {
  const tieneCabecera = Boolean(titulo || subtitulo || accion);

  return (
    <div
      className={`vidrio flex flex-col overflow-hidden ${className}`}
      {...props}
    >
      {tieneCabecera && (
        <div className="px-5 sm:px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between gap-3">
            {titulo && (
              <h3 className="text-base font-titulos font-semibold text-text tracking-normal truncate">
                {titulo}
              </h3>
            )}
            {accion && <div className="shrink-0">{accion}</div>}
          </div>
          {subtitulo && (
            <p className="text-xs font-sans font-medium text-text-muted mt-1 truncate">
              {subtitulo}
            </p>
          )}
        </div>
      )}
      <div
        className={
          bodyClassName
            ? bodyClassName
            : sinRelleno
            ? 'flex-1 flex flex-col'
            : 'p-5 sm:p-6 flex-1 flex flex-col'
        }
      >
        {children}
      </div>
    </div>
  );
};
