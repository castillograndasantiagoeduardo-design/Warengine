'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button3D } from '@/components/ui/Button3D';
import { SLIDES } from '../../data';
import type { SlideData } from '../../types';

interface AlcanceSectionProps {
  isVisible: boolean;
  onSelectPlan: (slideIndex: number) => void;
  onThemeChange: (slide: SlideData) => void;
}

export function AlcanceSection({
  isVisible,
  onSelectPlan,
  onThemeChange,
}: AlcanceSectionProps) {
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const burstRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const currentSlide = SLIDES[index];

  const triggerBurst = (color: string) => {
    if (!burstRef.current) return;
    burstRef.current.style.background = color;
    burstRef.current.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.15)', opacity: 0.9 },
        { transform: 'translate(-50%, -50%) scale(1.7)', opacity: 0 },
      ],
      { duration: 850, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    );
  };

  const goTo = (n: number) => {
    if (busy || n < 0 || n >= SLIDES.length || n === index) return;
    setBusy(true);
    setIndex(n);
    const s = SLIDES[n];
    onThemeChange(s);
    triggerBurst(s.c);

    setTimeout(() => {
      setBusy(false);
    }, 700);
  };

  const onThemeChangeRef = useRef(onThemeChange);
  useEffect(() => {
    onThemeChangeRef.current = onThemeChange;
  }, [onThemeChange]);

  useEffect(() => {
    if (isVisible) {
      onThemeChangeRef.current(SLIDES[index]);
      const timer = setTimeout(() => {
        triggerBurst(SLIDES[index].c);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isVisible, index]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a')) return;
    touchStartX.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 50) {
      goTo(index + (dx < 0 ? 1 : -1));
    }
  };

  return (
    <section
      className={`absolute inset-0 z-10 overflow-hidden select-none transition-opacity duration-600 ease-out ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      aria-label="Módulo de Alcance"
      aria-hidden={!isVisible}
    >
      {/* Fondos con Crossfade */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {SLIDES.map((s, idx) => (
          <div
            key={s.bg}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out ${
              idx === index ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${s.bg})` }}
          />
        ))}
      </div>

      {/* Pista de elementos 3D con Burst circular anclado exactamente detrás */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Burst circular de transición exactamente en el centro del dibujo (top: 46%, left: 50%) */}
        <div
          ref={burstRef}
          style={{
            position: 'absolute',
            left: '50%',
            top: '46%',
            width: 'min(30vw, 55vh)',
            height: 'min(30vw, 55vh)',
            borderRadius: '50%',
            opacity: 0,
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
          }}
        />

        {/* Imágenes 3D con el mismo anclaje top: 46%, left: 50% */}
        {SLIDES.map((s, idx) => {
          const d = idx - index;
          const a = Math.min(Math.abs(d), 1);
          const isFar = Math.abs(d) > 1;

          return (
            <img
              key={s.title}
              src={s.img}
              alt={s.title}
              draggable={false}
              className={`absolute object-contain pointer-events-none select-none transition-all duration-800 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isFar ? 'opacity-0' : ''
              }`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '46%',
                width: 'min(34vw, 66vh)',
                height: 'calc(min(34vw, 66vh) * 0.8)',
                transform: `translate(-50%, -50%) translate(${d * 33}vw, ${
                  a * 1.5
                }vh) rotate(${d * 7}deg) scale(${1 - a * 0.4})`,
                opacity: isFar ? 0 : 1 - a * 0.3,
                filter: 'drop-shadow(0 1.2vw 1.6vw rgba(0,0,0,0.35))',
                zIndex: 10 - Math.abs(d),
              }}
            />
          );
        })}
      </div>

      {/* Título del Slide */}
      <h2
        className="absolute left-0 right-0 top-[74%] text-center font-[family-name:var(--font-ui)] text-[clamp(24px,2.4vw,48px)] tracking-wide transition-colors duration-500 z-20"
        style={{ color: currentSlide.tc }}
      >
        {currentSlide.title}
      </h2>

      {/* Descripción */}
      <p
        className="absolute left-[max(2vw,4vw)] bottom-[max(3vw,6vh)] w-[clamp(240px,26vw,440px)] font-[family-name:var(--font-archivo)] font-black text-[clamp(14px,1.65vw,26px)] leading-[0.9] transition-colors duration-500 z-20"
        style={{ color: currentSlide.tc }}
      >
        {currentSlide.desc}
      </p>

      {/* Barra de Controles (Flechas, Paginación, Comprar) */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Flecha Izquierda */}
        <button
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="Anterior slide"
          className={`absolute top-[calc(90%-2.4vw)] left-[calc(35%-2.4vw)] w-[clamp(44px,4.8vw,80px)] h-[clamp(44px,4.8vw,80px)] rounded-full grid place-items-center transition-all duration-300 pointer-events-auto cursor-pointer hover:scale-108 active:scale-92 ${
            index === 0 ? 'opacity-30 pointer-events-none' : 'opacity-100'
          }`}
          style={{ background: currentSlide.c }}
        >
          <svg className="w-[55%] h-[55%]" viewBox="0 0 24 24">
            <path fill="#fff" d="M2 12l8-8v5h12v6H10v5z" />
          </svg>
        </button>

        {/* Dots Paginación */}
        <div className="absolute left-1/2 top-[90%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-[1.1vw] pointer-events-auto">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Ir al slide ${i + 1}`}
              className={`block w-[clamp(10px,0.8vw,16px)] h-[clamp(10px,0.8vw,16px)] rounded-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                i === index ? 'scale-[1.9]' : 'scale-100 hover:scale-125'
              }`}
              style={{ background: currentSlide.c }}
            />
          ))}
        </div>

        {/* Flecha Derecha */}
        <button
          onClick={() => goTo(index + 1)}
          disabled={index === SLIDES.length - 1}
          aria-label="Siguiente slide"
          className={`absolute top-[calc(90%-2.4vw)] left-[calc(65%-2.4vw)] w-[clamp(44px,4.8vw,80px)] h-[clamp(44px,4.8vw,80px)] rounded-full grid place-items-center transition-all duration-300 pointer-events-auto cursor-pointer hover:scale-108 active:scale-92 ${
            index === SLIDES.length - 1
              ? 'opacity-30 pointer-events-none'
              : 'opacity-100'
          }`}
          style={{ background: currentSlide.c }}
        >
          <svg className="w-[55%] h-[55%] scale-x-[-1]" viewBox="0 0 24 24">
            <path fill="#fff" d="M2 12l8-8v5h12v6H10v5z" />
          </svg>
        </button>

        {/* Botón Comprar */}
        <div className="absolute right-[max(2.6vw,4vw)] bottom-[max(2.6vw,4vh)] pointer-events-auto">
          <Button3D
            onClick={() => onSelectPlan(index)}
            className="text-[clamp(14px,1.6vw,26px)] px-[3vw]"
          >
            Comprar
          </Button3D>
        </div>
      </div>
    </section>
  );
}
