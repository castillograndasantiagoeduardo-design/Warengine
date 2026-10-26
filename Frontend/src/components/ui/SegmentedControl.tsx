'use client';

/**
 * SegmentedControl.tsx — Selector de opción única en píldoras (rango de fechas, agrupación…).
 */

interface SegmentedControlProps<V extends string> {
  options: { value: V; label: string }[];
  value: V;
  onChange: (value: V) => void;
  ariaLabel: string;
}

export function SegmentedControl<V extends string>({ options, value, onChange, ariaLabel }: SegmentedControlProps<V>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex flex-wrap rounded-xl border border-white/10 bg-[#0d1630] p-1">
      {options.map((o) => {
        const activo = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onChange(o.value)}
            className={`min-h-[44px] rounded-lg px-3 text-xs uppercase tracking-wider font-[family-name:var(--font-ui)] transition-colors cursor-pointer ${
              activo ? 'bg-[#e3b341] text-[#111] shadow-[0_3px_0_#b88a1f]' : 'text-white/65 hover:text-white'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
