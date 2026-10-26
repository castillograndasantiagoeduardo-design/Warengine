/**
 * Badge.tsx — Etiqueta píldora para estados (activo, inactivo, alerta…).
 */

import React from 'react';

export type BadgeTone = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'gold';

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  danger: 'bg-red-500/15 text-red-300 border-red-400/30',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  info: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
  neutral: 'bg-white/10 text-white/70 border-white/15',
  gold: 'bg-[#e3b341]/15 text-[#e9b949] border-[#e3b341]/40',
};

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-[family-name:var(--font-ui)] ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
