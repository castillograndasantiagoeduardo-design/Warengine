'use client';

/**
 * FondoAmbiental.tsx — Capa fija de iluminación ambiental, aurora, retícula y ruido de cristal.
 *
 * Implementación alineada estrictamente con prueba-diseno-warengine (localhost:3005):
 * - Fija en toda la ventana (fixed inset-0, -z-10, pointer-events-none, no intercepta clics).
 * - Mancha de luz superior izquierda (mancha-aurora-1): Iluminación clara y amplia detrás de
 *   "Resumen de la sucursal" y de la tarjeta "Ventas del día", eliminando áreas oscuras.
 * - Mancha de luz de KPIs (mancha-aurora-2): Resplandor tenue y difuso que no satura las tarjetas.
 * - Manchas secundaria y terciaria (mancha-aurora-3 y mancha inferior derecha).
 * - Capa de retícula arquitectónica (.capa-malla .trama-malla) visible en temas claro y oscuro.
 * - Textura de ruido analógico muy sutil (.textura-ruido).
 */

import React from 'react';

export function FondoAmbiental() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
      {/* 1. Iluminación superior izquierda clara (--p-luz-1): Detrás del título y "Ventas del día" */}
      <div className="mancha-luz mancha-aurora-1 absolute -top-10 left-0 sm:left-10 w-[640px] h-[520px] rounded-full bg-luz-1/28 dark:bg-luz-1/45 blur-[100px]" />

      {/* 2. Resplandor suave detrás de la fila de KPIs (--p-500, difuso y suave para mantener translucidez) */}
      <div className="mancha-luz mancha-aurora-2 absolute top-[10%] left-[16%] w-[580px] h-[380px] rounded-full bg-brand-500/16 dark:bg-brand-500/24 blur-[110px]" />

      {/* 3. Iluminación lateral derecha (--p-luz-2): Detrás del gráfico de ventas y panel de atención */}
      <div className="mancha-luz mancha-aurora-3 absolute top-[30%] right-[8%] w-[580px] h-[440px] rounded-full bg-luz-2/18 dark:bg-luz-2/30 blur-[110px]" />

      {/* 4. Iluminación inferior (--p-luz-3): Detrás de métodos de pago y tabla de facturas */}
      <div className="mancha-luz absolute bottom-[6%] right-[4%] w-[500px] h-[440px] rounded-full bg-luz-3/14 dark:bg-luz-3/20 blur-[110px]" />

      {/* 5. Capa de retícula arquitectónica (Retícula + luz) */}
      <div className="capa-malla absolute inset-0 trama-malla" />

      {/* 6. Textura de micro-ruido analógico de cristal */}
      <div className="absolute inset-0 textura-ruido" />
    </div>
  );
}
