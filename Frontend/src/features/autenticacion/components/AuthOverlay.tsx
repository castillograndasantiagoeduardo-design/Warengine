'use client';

/**
 * AuthOverlay.tsx — Panel overlay deslizante para vista de escritorio con animaciones fluidas.
 *
 * Principio SOLID:
 * - Single Responsibility: Encapsula el fondo dinámico, las curvas vectoriales y las
 *   transiciones crossfade del panel deslizante de escritorio.
 */

import React from 'react';

interface AuthOverlayProps {
  isLogin: boolean;
  onToggleMode: () => void;
}

export function AuthOverlay({ isLogin, onToggleMode }: AuthOverlayProps) {
  return (
    <div
      className="absolute top-0 bottom-0 left-0 w-1/2 z-20 overflow-hidden rounded-[22px] sm:rounded-[26px] transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] will-change-transform"
      style={{
        transform: isLogin ? 'translateX(100%)' : 'translateX(0%)',
        background: 'linear-gradient(135deg, #101a30 0%, #172442 50%, #0d1627 100%)',
        boxShadow: isLogin
          ? '-8px 0 28px rgba(0, 0, 0, 0.65), inset 1px 0 0 rgba(255, 255, 255, 0.08)'
          : '8px 0 28px rgba(0, 0, 0, 0.65), inset -1px 0 0 rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Formas orgánicas abstractas exclusivas del overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 select-none">
        <svg
          className="absolute -top-16 -right-16 w-64 h-64 text-[#e9b949]/15"
          viewBox="0 0 300 300"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="150" cy="150" r="120" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
          <path d="M40 150 Q 150 20 260 150 T 40 150" fill="currentColor" fillOpacity="0.1" />
        </svg>
        <svg
          className="absolute -bottom-20 -left-16 w-64 h-64 text-white/5"
          viewBox="0 0 300 300"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="150" cy="150" r="140" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      {/* Contenido Dinámico del Overlay (Crossfade sincronizado) */}
      <div className="relative w-full h-full flex items-center justify-center p-8 text-center z-10">
        {/* Overlay cuando estamos en LOGIN (Invita a Crear Cuenta) */}
        <div
          className={`max-w-[270px] transition-all duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
            isLogin
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95 pointer-events-none absolute'
          }`}
        >
          <h2 className="font-[family-name:var(--font-anton)] text-3xl uppercase tracking-wider text-white mb-2">
            ¡Hola, <span className="text-[#E9B949]">Amigo!</span>
          </h2>
          <p className="font-[family-name:var(--font-archivo)] text-xs text-white/75 leading-relaxed mb-6">
            Ingresa tus credenciales institucionales o solicita el alta de tu usuario para acceder a tus módulos y sucursales.
          </p>
          <button
            type="button"
            onClick={onToggleMode}
            className="rounded-full px-6 py-2.5 border-2 border-white/70 text-white font-[family-name:var(--font-pixelify)] font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-[#14213D] hover:border-white transition-all duration-200 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{
              boxShadow:
                '4px 4px 10px rgba(0,0,0,0.4), -3px -3px 8px rgba(255,255,255,0.05)',
            }}
          >
            Crear cuenta
          </button>
        </div>

        {/* Overlay cuando estamos en REGISTRO (Invita a Iniciar Sesión) */}
        <div
          className={`max-w-[270px] transition-all duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
            !isLogin
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95 pointer-events-none absolute'
          }`}
        >
          <h2 className="font-[family-name:var(--font-anton)] text-3xl uppercase tracking-wider text-white mb-2">
            ¡Bienvenido de <span className="text-[#E9B949]">Nuevo!</span>
          </h2>
          <p className="font-[family-name:var(--font-archivo)] text-xs text-white/75 leading-relaxed mb-6">
            Para mantenerte conectado con tus inventarios, turnos de caja y ventas, inicia sesión con tu correo asignado.
          </p>
          <button
            type="button"
            onClick={onToggleMode}
            className="rounded-full px-6 py-2.5 border-2 border-white/70 text-white font-[family-name:var(--font-pixelify)] font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-[#14213D] hover:border-white transition-all duration-200 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{
              boxShadow:
                '4px 4px 10px rgba(0,0,0,0.4), -3px -3px 8px rgba(255,255,255,0.05)',
            }}
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
