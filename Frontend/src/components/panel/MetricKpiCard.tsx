import React from 'react';

interface MetricKpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  icon?: React.ReactNode;
  accent?: 'gold' | 'emerald' | 'rose' | 'blue';
}

export function MetricKpiCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  accent = 'gold',
}: MetricKpiCardProps) {
  const accentStyles = {
    gold: {
      border: 'hover:border-[#e3b341]/40',
      glow: 'hover:shadow-[0_4px_24px_rgba(227,179,65,0.12)]',
      iconBg: 'bg-[#e3b341]/10 text-[#e3b341] border-[#e3b341]/20',
      badge: 'text-[#e3b341] bg-[#e3b341]/10',
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      glow: 'hover:shadow-[0_4px_24px_rgba(16,185,129,0.12)]',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      badge: 'text-emerald-400 bg-emerald-500/10',
    },
    rose: {
      border: 'hover:border-rose-500/40',
      glow: 'hover:shadow-[0_4px_24px_rgba(244,63,94,0.12)]',
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      badge: 'text-rose-400 bg-rose-500/10',
    },
    blue: {
      border: 'hover:border-sky-500/40',
      glow: 'hover:shadow-[0_4px_24px_rgba(14,165,233,0.12)]',
      iconBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      badge: 'text-sky-400 bg-sky-500/10',
    },
  }[accent];

  return (
    <div
      className={`relative p-5 rounded-2xl bg-gradient-to-b from-[#131d3b]/90 to-[#0e1630]/90 border border-white/10 ${accentStyles.border} ${accentStyles.glow} transition-all duration-300 group select-none backdrop-blur-sm`}
    >
      {/* Luz superior decorativa */}
      <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-[#e3b341]/50 transition-colors" />

      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-white/60 font-semibold font-[family-name:var(--font-archivo)]">
          {title}
        </span>
        {icon && (
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${accentStyles.iconBg}`}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Valor en tipografía Anton */}
      <div className="mt-3">
        <div className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl xl:text-4xl tracking-wide text-white leading-tight">
          {value}
        </div>
      </div>

      {/* Tendencia y Subtexto */}
      {(trend || subtitle) && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
          {trend ? (
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold font-[family-name:var(--font-pixelify)] ${
                  trend.isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              {trend.label && (
                <span className="text-white/40 text-[11px] font-[family-name:var(--font-archivo)]">
                  {trend.label}
                </span>
              )}
            </div>
          ) : <div />}

          {subtitle && (
            <span className="text-[11px] text-white/50 font-medium font-[family-name:var(--font-archivo)]">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
