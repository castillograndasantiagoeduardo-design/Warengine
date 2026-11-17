'use client';

/**
 * FondoAmbiental.tsx — Capa fija de iluminación ambiental, aurora, retícula y ruido de cristal.
 *
 * Implementación con style explícito de filter: blur(125px-130px) y opacidades suaves (0.16 a 0.22)
 * para lograr una luz atmosférica, suave y pareja sin teñir ni saturar las tarjetas.
 */

import React from 'react';

export function FondoAmbiental() {
  return (
    /* CAPA DE FONDO AMBIENTAL FIJA */
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* 1. Orbe superior izquierdo — suave y muy difuminado */}
      <div
        className="mancha-luz mancha-aurora-1 absolute -top-24 -left-24 w-[520px] h-[520px] rounded-full"
        style={{
          backgroundColor: 'var(--p-luz-1, #2551d6)',
          opacity: 0.22,
          filter: 'blur(125px)',
        }}
      />

      {/* 2. Orbe central-izquierdo detrás de los KPIs — opacidad controlada (0.20) para NO teñir de azul fuerte la primera tarjeta */}
      <div
        className="mancha-luz mancha-aurora-2 absolute top-[12%] left-[24%] w-[560px] h-[360px] rounded-full"
        style={{
          backgroundColor: 'var(--p-500, #3b6cf2)',
          opacity: 0.20,
          filter: 'blur(130px)',
        }}
      />

      {/* 3. Orbe central-derecho detrás del gráfico y Requiere atención */}
      <div
        className="mancha-luz mancha-aurora-3 absolute top-[32%] right-[8%] w-[600px] h-[460px] rounded-full"
        style={{
          backgroundColor: 'var(--p-luz-2, #4f46e5)',
          opacity: 0.22,
          filter: 'blur(130px)',
        }}
      />

      {/* 4. Orbe inferior derecho detrás de Métodos de pago / Activos */}
      <div
        className="mancha-luz absolute bottom-[6%] right-[4%] w-[520px] h-[440px] rounded-full"
        style={{
          backgroundColor: 'var(--p-luz-3, #06b6d4)',
          opacity: 0.16,
          filter: 'blur(125px)',
        }}
      />

      {/* Capa para la variante de fondo "malla" (retícula muy tenue al 3.5%) */}
      <div className="capa-malla absolute inset-0 trama-malla" />

      {/* Textura de ruido sutil */}
      <div className="absolute inset-0 textura-ruido" />
    </div>
  );
}
