'use client';

/**
 * StatusBadge.tsx — Píldoras de estado luminosas para WarEngine.
 *
 * Principio SOLID: Open/Closed Principle (OCP).
 * Permite variantes cromáticas y tamaños extensibles sin alterar el layout interno.
 */

import React from 'react';

export type StatusBadgeVariant = 'success' | 'warning' | 'danger' | 'gold' | 'neutral';

interface StatusBadgeProps {
  variant?: StatusBadgeVariant;
  label: React.ReactNode;
  pulseDot?: boolean;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<StatusBadgeVariant, { container: string; dot: string; ping: string }> = {
  success: {
    container: 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/25',
    dot: 'bg-[#10b981]',
    ping: 'bg-[#10b981]/60',
  },
  warning: {
    container: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/25',
    dot: 'bg-[#f59e0b]',
    ping: 'bg-[#f59e0b]/60',
  },
  danger: {
    container: 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/25',
    dot: 'bg-[#ef4444]',
    ping: 'bg-[#ef4444]/60',
  },
  gold: {
    container: 'bg-[#e3b341]/10 text-[#e3b341] border-[#e3b341]/30',
    dot: 'bg-[#e3b341]',
    ping: 'bg-[#e3b341]/60',
  },
  neutral: {
    container: 'bg-white/[0.04] text-slate-400 border-white/10',
    dot: 'bg-slate-400',
    ping: 'bg-slate-400/50',
  },
};

export function StatusBadge({
  variant = 'neutral',
  label,
  pulseDot = false,
  size = 'sm',
  icon,
  className = '',
}: StatusBadgeProps) {
  const styles = VARIANT_STYLES[variant];
  const sizeClasses = size === 'sm' ? 'text-[10px] py-0.5 px-2 gap-1.5' : 'text-xs py-1 px-2.5 gap-2';

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        tracking-wider uppercase font-[family-name:var(--font-pixelify)]
        ${styles.container}
        ${sizeClasses}
        ${className}
      `}
    >
      {pulseDot && (
        <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${styles.ping}`} />
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${styles.dot}`} />
        </span>
      )}
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{label}</span>
    </span>
  );
}
