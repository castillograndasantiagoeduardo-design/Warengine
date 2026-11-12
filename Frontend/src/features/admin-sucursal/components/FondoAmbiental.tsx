'use client';

/**
 * FondoAmbiental.tsx — Capa fija de iluminación ambiental suave y textura de cristal.
 *
 * Mantiene la profundidad y elegancia oscura de WarEngine sin saturar de azul
 * los componentes ni las tarjetas KPI.
 */

import React, { useEffect, useState } from 'react';

export function FondoAmbiental() {
  const [fondo, setFondo] = useState('orbes');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const f = localStorage.getItem('warengine-fondo') || 'orbes';
    setFondo(f);

    const observer = new MutationObserver(() => {
      const attr = document.documentElement.getAttribute('data-fondo') || 'orbes';
      setFondo(attr);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-fondo'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* 1. Fondo base oscuro profundo */}
      <div className="absolute inset-0 bg-bg transition-colors duration-500" />

      {/* 2. Trama de Malla Fina Sutil (Matriz tecnológica como en imagen 1) */}
      <div className="absolute inset-0 trama-malla opacity-35 pointer-events-none" />

      {/* 3. Manchas / Orbes de Iluminación Ambiental MUY TENUES (4-8% opacidad, sin saturar KPIs) */}
      {fondo === 'orbes' && (
        <>
          {/* Mancha 1: Arriba Izquierda */}
          <div
            className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full blur-[160px] opacity-[0.08] transition-all duration-700"
            style={{ backgroundColor: 'var(--p-luz-1, #2551d6)' }}
          />

          {/* Mancha 2: Centro (Aura tenue detrás de las gráficas, sin saturar KPIs) */}
          <div
            className="absolute top-1/3 left-1/4 w-[480px] h-[320px] rounded-full blur-[160px] opacity-[0.04] transition-all duration-700"
            style={{ backgroundColor: 'var(--p-500, #3b82f6)' }}
          />

          {/* Mancha 3: Centro-Derecha */}
          <div
            className="absolute top-1/2 right-1/10 w-[440px] h-[360px] rounded-full blur-[160px] opacity-[0.05] transition-all duration-700"
            style={{ backgroundColor: 'var(--p-luz-2, #4f46e5)' }}
          />

          {/* Mancha 4: Abajo Derecha */}
          <div
            className="absolute -bottom-36 right-1/4 w-[400px] h-[360px] rounded-full blur-[160px] opacity-[0.04] transition-all duration-700"
            style={{ backgroundColor: 'var(--p-luz-3, #06b6d4)' }}
          />
        </>
      )}

      {/* 4. Variante Aurora Ambiental */}
      {fondo === 'aurora' && (
        <div className="absolute inset-0 opacity-[0.07]">
          <div
            className="absolute -top-1/4 left-0 right-0 h-[500px] blur-[160px] transition-all duration-700"
            style={{
              background: `linear-gradient(135deg, var(--p-luz-1, #2551d6) 0%, var(--p-luz-2, #4f46e5) 50%, var(--p-luz-3, #06b6d4) 100%)`,
            }}
          />
        </div>
      )}

      {/* 5. Variante Retícula + Luz */}
      {fondo === 'reticula' && (
        <div
          className="absolute top-0 right-1/4 w-[500px] h-[380px] rounded-full blur-[160px] opacity-[0.06] transition-all duration-700"
          style={{ backgroundColor: 'var(--p-500, #3b82f6)' }}
        />
      )}

      {/* 6. Textura de Ruido Analógico Submarino Fino */}
      <div className="absolute inset-0 textura-ruido pointer-events-none" />
    </div>
  );
}
