/**
 * KpiCard.tsx — Tarjeta de indicador (stat tile): etiqueta, cifra grande y contexto.
 */

import { Skeleton } from '@/components/ui/Skeleton';

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: string;
  loading?: boolean;
  destacado?: boolean;
}

export function KpiCard({ label, value, hint, icon, loading, destacado }: KpiCardProps) {
  return (
    <div className={`panel-card p-4 flex flex-col gap-2 ${destacado ? 'ring-1 ring-[#e3b341]/50' : ''}`}>
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-white/60 font-[family-name:var(--font-ui)]">
        <span>{label}</span>
        {icon && (
          <span aria-hidden="true" className="text-[#e9b949]">
            {icon}
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-9 w-2/3" />
      ) : (
        <p className={`font-[family-name:var(--font-anton)] text-3xl tracking-wide leading-none ${destacado ? 'text-[#e9b949]' : 'text-white'}`}>
          {value}
        </p>
      )}
      {hint && !loading && <p className="text-xs text-white/50">{hint}</p>}
    </div>
  );
}
