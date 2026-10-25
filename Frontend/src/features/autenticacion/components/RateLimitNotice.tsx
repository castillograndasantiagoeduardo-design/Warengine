'use client';

/**
 * RateLimitNotice.tsx — Banner neumórfico de aviso ante bloqueo por fuerza bruta (HTTP 429).
 *
 * Principio SOLID:
 * - Single Responsibility: Muestra el estado de bloqueo temporal y el temporizador regresivo
 *   sin contaminar los formularios de ingreso.
 */

import React from 'react';

interface RateLimitNoticeProps {
  mensaje?: string;
  tiempoRestanteSegundos?: number;
}

export function RateLimitNotice({
  mensaje = 'Demasiados intentos fallidos. Por tu seguridad, el acceso ha sido pausado temporalmente.',
  tiempoRestanteSegundos = 0,
}: RateLimitNoticeProps) {
  const minutos = Math.floor(tiempoRestanteSegundos / 60);
  const segundos = tiempoRestanteSegundos % 60;
  const tiempoFormateado = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

  return (
    <div
      role="alert"
      className="w-full rounded-2xl p-4 bg-[#1a2b4f]/90 border border-amber-500/30 text-amber-200 text-xs font-[family-name:var(--font-archivo)] mb-4 animate-in fade-in duration-300"
      style={{
        boxShadow:
          'inset 3px 3px 8px rgba(0,0,0,0.4), inset -2px -2px 6px rgba(255,255,255,0.03), 0 4px 12px rgba(233,185,73,0.12)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 shrink-0">
          <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="font-bold text-amber-300 tracking-wide font-[family-name:var(--font-pixelify)] uppercase text-xs">
            Acceso en pausa temporal
          </h4>
          <p className="text-white/80 leading-relaxed text-[11px]">{mensaje}</p>
          {tiempoRestanteSegundos > 0 && (
            <p className="font-mono text-amber-400 text-[12px] pt-1 font-bold">
              Podrás reintentar en: <span className="underline">{tiempoFormateado}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
