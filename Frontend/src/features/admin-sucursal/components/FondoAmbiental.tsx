'use client';

/**
 * FondoAmbiental.tsx — Capa fija de iluminación ambiental, aurora, retícula y ruido de cristal.
 *
 * Implementación idéntica al proyecto de referencia (localhost:3005):
 * - Fija en toda la ventana (fixed inset-0, -z-10, pointer-events-none).
 * - 4 manchas de luz ambiental con variables de paleta (--p-luz-1, --p-500, --p-luz-2, --p-luz-3).
 * - Capa de retícula arquitectónica (.capa-malla .trama-malla).
 * - Textura sutil de ruido analógico (.textura-ruido).
 * - Soporta los 3 efectos: Orbes difusos, Aurora ambiental y Retícula + luz vía CSS dinámico.
 */

import React from 'react';

export function FondoAmbiental() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
      {/* (d) Arriba a la izquierda (--p-luz-1) */}
      <div className="mancha-luz mancha-aurora-1 absolute -top-16 -left-16 w-[480px] h-[480px] rounded-full bg-luz-1/22 dark:bg-luz-1/35 blur-[110px]" />

      {/* (a) Detrás de la fila de KPIs (--p-500, a la izquierda del centro) */}
      <div className="mancha-luz mancha-aurora-2 absolute top-[11%] left-[22%] w-[540px] h-[350px] rounded-full bg-brand-500/22 dark:bg-brand-500/34 blur-[110px]" />

      {/* (b) Detrás del gráfico de ventas (--p-luz-2, a la derecha) */}
      <div className="mancha-luz mancha-aurora-3 absolute top-[33%] right-[10%] w-[580px] h-[440px] rounded-full bg-luz-2/20 dark:bg-luz-2/32 blur-[110px]" />

      {/* (c) Detrás de métodos de pago / abajo a la derecha (--p-luz-3) */}
      <div className="mancha-luz absolute bottom-[6%] right-[4%] w-[500px] h-[440px] rounded-full bg-luz-3/16 dark:bg-luz-3/22 blur-[110px]" />

      {/* Capa para la variante de fondo "malla" (Retícula + luz) */}
      <div className="capa-malla absolute inset-0 trama-malla" />

      {/* Textura de ruido muy tenue (< 0.04) */}
      <div className="absolute inset-0 textura-ruido" />
    </div>
  );
}
