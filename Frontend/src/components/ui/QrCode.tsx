'use client';

/**
 * QrCode.tsx — Código QR en SVG (React puro, sin innerHTML) a partir de un texto.
 *
 * Usa qrcode-generator solo para calcular la matriz de módulos; el dibujo es nuestro.
 */

import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

interface QrCodeProps {
  value: string;
  /** Lado en píxeles. */
  size?: number;
  ariaLabel: string;
}

const MARGEN = 2; // módulos de zona silenciosa

export function QrCode({ value, size = 200, ariaLabel }: QrCodeProps) {
  const { modulos, n } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const total = qr.getModuleCount();
    const oscuros: [number, number][] = [];
    for (let fila = 0; fila < total; fila++) {
      for (let col = 0; col < total; col++) {
        if (qr.isDark(fila, col)) oscuros.push([col, fila]);
      }
    }
    return { modulos: oscuros, n: total };
  }, [value]);

  const lado = n + MARGEN * 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${lado} ${lado}`} role="img" aria-label={ariaLabel} shapeRendering="crispEdges" className="rounded-xl">
      <rect width={lado} height={lado} fill="#ffffff" />
      {modulos.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x + MARGEN} y={y + MARGEN} width={1} height={1} fill="#0d1630" />
      ))}
    </svg>
  );
}
