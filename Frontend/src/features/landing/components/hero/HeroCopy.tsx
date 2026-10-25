'use client';

/**
 * HeroCopy.tsx — Titular principal y tipografía de impacto de la sección Hero.
 */

import React from 'react';

export function HeroCopy({ isVisible = true }: { isVisible?: boolean }) {
  return (
    <section
      className={`absolute z-10 left-[max(2vw,4vw)] top-1/2 -translate-y-[52%] pointer-events-none transition-all duration-700 ease-out select-none ${
        isVisible
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 -translate-x-[4vw]'
      }`}
      aria-label="Presentación WarEngine"
    >
      <h1 className="relative inline-block font-[family-name:var(--font-anton)] text-[clamp(48px,9.25vw,140px)] leading-none uppercase text-white tracking-normal">
        WAR<em className="not-italic text-[var(--gold)]">E</em>NGINE
        <span className="absolute left-[calc(100%+0.25em)] top-[-0.62em] w-[1.75em] h-[1.75em] rounded-full bg-[var(--gold)] text-white font-[family-name:var(--font-archivo)] font-black text-[0.13em] leading-[1.75em] text-center inline-block">
          R
        </span>
      </h1>
      <p className="mt-[-0.2vw] ml-[0.5vw] font-[family-name:var(--font-archivo)] font-black text-[clamp(14px,3.2vw,48px)] leading-[0.85] uppercase text-white">
        <span className="block whitespace-nowrap">Administracion, ventas &amp;</span>
        <span className="block whitespace-nowrap">Logistica</span>
      </p>
      <p className="relative mt-[-1.2vw] ml-[clamp(30px,19.4vw,280px)] font-[family-name:var(--font-bodoni)] italic font-semibold text-[clamp(28px,6.4vw,96px)] leading-none uppercase text-[var(--gold)] whitespace-nowrap scale-x-[0.75] origin-top-left">
        A otro nivel
      </p>
    </section>
  );
}
