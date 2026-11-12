'use client';

/**
 * FondoAmbiental.tsx — Capa fija de iluminación ambiental, orbes difusos y textura de cristal.
 *
 * Se posiciona en fixed inset-0 con -z-10, garantizando que el glassmorphism
 * de las tarjetas (.vidrio) y barras (.vidrio-fuerte) refracte las luces vivas del tema.
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
      {/* 1. Fondo base dinámico */}
      <div className="absolute inset-0 bg-bg transition-colors duration-500" />

      {/* 2. Manchas / Orbes de Iluminación Ambiental */}
      {fondo === 'orbes' && (
        <>
          {/* Mancha 1: Arriba Izquierda */}
          <div
            className="absolute -top-24 -left-20 w-[480px] h-[480px] rounded-full blur-[110px] opacity-70 transition-all duration-700"
            style={{ backgroundColor: 'var(--p-luz-1, #2551d6)' }}
          />

          {/* Mancha 2: Centro-Izquierda (Detrás de KPIs) */}
          <div
            className="absolute top-1/4 left-1/12 w-[540px] h-[350px] rounded-full blur-[110px] opacity-60 transition-all duration-700"
            style={{ backgroundColor: 'var(--p-500, #3b6cf2)' }}
          />

          {/* Mancha 3: Centro-Derecha */}
          <div
            className="absolute top-1/3 right-1/10 w-[580px] h-[440px] rounded-full blur-[110px] opacity-65 transition-all duration-700"
            style={{ backgroundColor: 'var(--p-luz-2, #4f46e5)' }}
          />

          {/* Mancha 4: Abajo Derecha */}
          <div
            className="absolute -bottom-32 right-1/4 w-[500px] h-[440px] rounded-full blur-[110px] opacity-55 transition-all duration-700"
            style={{ backgroundColor: 'var(--p-luz-3, #06b6d4)' }}
          />
        </>
      )}

      {/* 3. Variante Aurora Ambiental */}
      {fondo === 'aurora' && (
        <div className="absolute inset-0 opacity-40">
          <div
            className="absolute -top-1/4 left-0 right-0 h-[600px] blur-[120px] transition-all duration-700"
            style={{
              background: `linear-gradient(135deg, var(--p-luz-1, #2551d6) 0%, var(--p-luz-2, #4f46e5) 50%, var(--p-luz-3, #06b6d4) 100%)`,
            }}
          />
          <div
            className="absolute bottom-0 left-1/4 w-[700px] h-[400px] rounded-full blur-[130px] opacity-50"
            style={{ backgroundColor: 'var(--p-500, #3b6cf2)' }}
          />
        </div>
      )}

      {/* 4. Variante Retícula + Luz */}
      {fondo === 'reticula' && (
        <>
          <div
            className="absolute top-0 right-1/4 w-[600px] h-[450px] rounded-full blur-[120px] opacity-60 transition-all duration-700"
            style={{ backgroundColor: 'var(--p-500, #3b6cf2)' }}
          />
          <div className="absolute inset-0 trama-malla opacity-80" />
        </>
      )}

      {/* 5. Textura de Ruido Analógico Submarino */}
      <div className="absolute inset-0 textura-ruido pointer-events-none" />
    </div>
  );
}

