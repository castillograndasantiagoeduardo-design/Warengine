'use client';

/**
 * KpiMetricCard.tsx — Tarjeta de indicador de rendimiento clave (KPI) para WarEngine.
 *
 * Principio SOLID: Single Responsibility Principle (SRP).
 * Diseñado con tipografía monoespaciada con espaciado tabular (tabular-nums),
 * jerarquía de contraste y micro-badges porcentuales extraídos del diseño de Figma.
 */

import React from 'react';
import { GlassCard } from './GlassCard';
import { StatusBadge, StatusBadgeVariant } from './StatusBadge';

interface KpiMetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trendText?: string;
  trendVariant?: StatusBadgeVariant;
  trendIcon?: React.ReactNode;
  pulseDot?: boolean;
  contextText?: string;
  className?: string;
}

export function KpiMetricCard({
  title,
  value,
  icon,
  trendText,
  trendVariant = 'success',
  trendIcon,
  pulseDot = false,
  contextText,
  className = '',
}: KpiMetricCardProps) {
  return (
    <GlassCard hoverEffect padding="lg" className={`flex flex-col justify-between min-h-[148px] ${className}`}>
      {/* Cabecera: Título e Icono en cápsula de vidrio */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-medium text-slate-400 font-[family-name:var(--font-archivo)]">
          {title}
        </span>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#e3b341]">
          {icon}
        </div>
      </div>

      {/* Valor principal numérico con espaciado tabular estricto */}
      <div className="my-2">
        <h3 className="text-2xl lg:text-[28px] font-semibold tracking-tight text-white font-mono tabular-nums leading-tight">
          {value}
        </h3>
      </div>

      {/* Pie: Micro-badge de tendencia y texto descriptivo */}
      <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.04]">
        {trendText && (
          <StatusBadge
            variant={trendVariant}
            label={trendText}
            icon={trendIcon}
            pulseDot={pulseDot}
            size="sm"
          />
        )}
        {contextText && (
          <span className="text-[11px] text-slate-400 font-[family-name:var(--font-archivo)] truncate">
            {contextText}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
