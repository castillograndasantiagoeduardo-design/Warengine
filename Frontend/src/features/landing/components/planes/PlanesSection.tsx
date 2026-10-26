'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PixelCard } from './PixelCard';
import { PLANS } from '../../data';

interface PlanesSectionProps {
  isVisible: boolean;
  selectedPlanIndex?: number;
}

export function PlanesSection({
  isVisible,
  selectedPlanIndex = -1,
}: PlanesSectionProps) {
  const [pickedIndex, setPickedIndex] = useState<number>(selectedPlanIndex);

  const handlePick = (index: number) => {
    setPickedIndex(index);
  };

  return (
    <section
      className={`absolute inset-0 z-10 flex flex-col items-center justify-center pt-[max(4vw,40px)] pb-[max(2vw,20px)] overflow-y-auto transition-opacity duration-600 ease-out select-none bg-[radial-gradient(60vw_60vh_at_50%_48%,rgba(233,185,73,0.14),transparent_70%)] bg-[#202022] ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-label="Planes y Precios"
      aria-hidden={!isVisible}
    >
      {/* Título de Sección */}
      <h2 className="font-[family-name:var(--font-anton)] text-[clamp(32px,4vw,64px)] uppercase tracking-wider mb-[2vw] text-center text-white">
        Elige tu <em className="not-italic text-[var(--gold)]">plan</em>
      </h2>

      {/* Fila de Tarjetas */}
      <div className="flex flex-col lg:flex-row gap-[clamp(16px,2.4vw,36px)] justify-center items-center lg:items-stretch px-4 w-full max-w-7xl">
        {PLANS.map((plan, idx) => {
          const isPicked = pickedIndex === idx;

          return (
            <PixelCard
              key={plan.id}
              colors={plan.pixels}
              glowColor={plan.color}
              accentColor={plan.color}
              textColor={plan.textColor}
              isPicked={isPicked}
              onClick={() => handlePick(idx)}
              className="bg-gradient-to-b from-[#17151c] to-[#0f0e13] shadow-[0_24px_48px_-24px_rgba(0,0,0,0.85)] cursor-pointer"
            >
              {/* Imagen Ilustrativa */}
              <div className="relative w-[68%] h-[36%] max-h-[120px] mb-1">
                <Image
                  src={plan.img}
                  alt={`Plan ${plan.name}`}
                  fill
                  sizes="200px"
                  className="object-contain filter drop-shadow-[0_0.8vw_1vw_rgba(0,0,0,0.4)]"
                />
              </div>

              {/* Nombre del Plan */}
              <h3
                className="font-[family-name:var(--font-ui)] text-[clamp(18px,2vw,30px)] tracking-wider"
                style={{ color: plan.textColor }}
              >
                {plan.name}
              </h3>

              {/* Etiqueta especial si existe */}
              {plan.tag && (
                <span
                  className="font-[family-name:var(--font-ui)] font-medium text-[clamp(10px,0.95vw,14px)] text-[#111111] rounded-full px-[0.8vw] py-[0.2vw]"
                  style={{ backgroundColor: plan.textColor }}
                >
                  {plan.tag}
                </span>
              )}

              {/* Precio */}
              <div className="flex items-baseline gap-1 my-1">
                <b className="font-[family-name:var(--font-anton)] text-[clamp(28px,3.3vw,52px)] text-white">
                  ${plan.price}
                </b>
                <span className="font-[family-name:var(--font-ui)] text-[clamp(12px,1.1vw,16px)] text-[#a0a5b1]">
                  /mes
                </span>
              </div>

              {/* Descripción */}
              <p
                className="font-[family-name:var(--font-archivo)] font-black text-[clamp(12px,1.2vw,17px)] leading-[0.98] max-w-[92%]"
                style={{ color: plan.textColor }}
              >
                {plan.desc}
              </p>

              {/* Lista de Capacidades / Módulos */}
              {plan.features && plan.features.length > 0 && (
                <ul className="flex flex-col gap-1 w-[92%] my-1 text-left border-y border-white/10 py-1.5">
                  {plan.features.map((feat, fIdx) => (
                    <li
                      key={fIdx}
                      className="flex items-center gap-2 font-[family-name:var(--font-archivo)] text-[clamp(10px,0.85vw,13px)] text-[#d5dae2]"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-[1px] shrink-0"
                        style={{
                          backgroundColor: plan.textColor,
                          boxShadow: `0 0 6px ${plan.textColor}`,
                        }}
                      />
                      <span className="truncate leading-tight font-bold">{feat}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Botón Comprar */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePick(idx);
                }}
                className="mt-auto text-[#111111] font-[family-name:var(--font-ui)] font-medium text-[clamp(13px,1.3vw,18px)] tracking-wider rounded-[0.9vw] px-[2vw] py-[0.4vw] shadow-[0_0.25vw_0_rgba(0,0,0,0.6)] hover:translate-y-[2px] transition-all duration-100 cursor-pointer"
                style={{ backgroundColor: plan.textColor }}
                aria-label={`Comprar plan ${plan.name}`}
              >
                Comprar
              </button>
            </PixelCard>
          );
        })}
      </div>
    </section>
  );
}
