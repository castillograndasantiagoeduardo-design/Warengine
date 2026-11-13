'use client';

/**
 * GlassCard.tsx — Contenedor de superficie con estética Glassmorphism para WarEngine.
 *
 * Principio SOLID: Single Responsibility Principle (SRP).
 * Encapsula la elevación, sombras, borde translúcido y desenfoque de fondo
 * basados en los tokens extraídos directamente del diseño de Figma (nodo 0:1).
 */

import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
}

const PADDING_MAP = {
  none: '',
  sm: 'p-3 md:p-4',
  md: 'p-4 md:p-5',
  lg: 'p-5 md:p-6',
};

export function GlassCard({
  children,
  className = '',
  padding = 'md',
  hoverEffect = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={`
        vidrio overflow-hidden
        ${hoverEffect ? 'hover:-translate-y-1' : ''}
        ${PADDING_MAP[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
