'use client';

/**
 * useAnchoContenedor.ts — Mide el ancho real de un contenedor para dibujar SVG en píxeles
 * (sin deformar textos como haría un viewBox estirado).
 */

import { useEffect, useRef, useState } from 'react';

export function useAnchoContenedor<T extends HTMLElement>(anchoInicial = 640) {
  const ref = useRef<T>(null);
  const [ancho, setAncho] = useState(anchoInicial);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const nuevo = Math.floor(entry.contentRect.width);
      if (nuevo > 0) setAncho(nuevo);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, ancho };
}
