'use client';

/**
 * FondoAmbiental.tsx — Capa fija de iluminación ambiental, aurora, retícula y ruido de cristal.
 *
 * Implementación oficial copiada directamente de prueba-diseno-warengine (localhost:3005).
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
      <div className="mancha-luz mancha-aurora-1 absolute -top-16 -left-16 w-[480px] h-[480px] rounded-full bg-luz-1/14 dark:bg-luz-1/20 blur-[130px]" />

      {/* (a) Detrás de la fila de KPIs (--p-500, suave para no saturar las tarjetas) */}
      <div className="mancha-luz mancha-aurora-2 absolute top-[12%] left-[20%] w-[520px] h-[320px] rounded-full bg-brand-500/12 dark:bg-brand-500/18 blur-[130px]" />

      {/* (b) Detrás del gráfico de ventas (--p-luz-2, a la derecha) */}
      <div className="mancha-luz mancha-aurora-3 absolute top-[35%] right-[10%] w-[560px] h-[420px] rounded-full bg-luz-2/14 dark:bg-luz-2/20 blur-[130px]" />

      {/* (c) Detrás de métodos de pago / abajo a la derecha (--p-luz-3) */}
      <div className="mancha-luz absolute bottom-[6%] right-[4%] w-[480px] h-[420px] rounded-full bg-luz-3/12 dark:bg-luz-3/16 blur-[130px]" />

      {/* Capa para la variante de fondo "malla" (Retícula + luz) */}
      <div className="capa-malla absolute inset-0 trama-malla" />

      {/* Textura de ruido muy tenue (< 0.04) */}
      <div className="absolute inset-0 textura-ruido" />
    </div>
  );
}
