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
        relative overflow-hidden rounded-2xl
        bg-[#111d3f]/65 backdrop-blur-md
        border border-white/[0.08]
        shadow-[0_8px_24px_0_rgba(2,8,23,0.22)]
        ${hoverEffect ? 'transition-all duration-200 hover:border-white/[0.16] hover:shadow-[0_12px_32px_0_rgba(2,8,23,0.35)] hover:-translate-y-0.5' : ''}
        ${PADDING_MAP[padding]}
        ${className}
      `}
      {...props}
    >
      {/* Sutil resplandor de borde superior tipo luz difusa */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
