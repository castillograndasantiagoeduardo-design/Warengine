'use client';

/**
 * SocialAuthButtons.tsx — Botones de autenticación social con estética neumórfica.
 *
 * Principio SOLID:
 * - Single Responsibility: Encapsula exclusivamente los botones de proveedores sociales
 *   para evitar duplicar código SVG en vistas desktop y móvil.
 */

import React from 'react';

interface SocialAuthButtonsProps {
  onSelectProvider?: (provider: 'google' | 'github' | 'microsoft') => void;
}

export function SocialAuthButtons({ onSelectProvider }: SocialAuthButtonsProps) {
  const handleClick = (provider: 'google' | 'github' | 'microsoft') => {
    if (onSelectProvider) {
      onSelectProvider(provider);
    } else {
      // Notificación informativa para el usuario de demo/futura expansión OAuth
      alert(`El inicio de sesión institucional con ${provider.toUpperCase()} se encuentra en fase de integración.`);
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 mb-3">
      {/* Botón Google */}
      <button
        type="button"
        onClick={() => handleClick('google')}
        aria-label="Iniciar sesión con Google"
        className="w-9 h-9 rounded-full grid place-items-center bg-[#14213D] text-white/80 hover:text-[#E9B949] transition-all duration-200 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9B949]"
        style={{
          boxShadow:
            '4px 4px 10px rgba(5, 10, 20, 0.75), -3px -3px 8px rgba(255, 255, 255, 0.04)',
        }}
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12.24 10.285V13.4h6.887C18.2 16.14 15.645 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.465 0 2.805.53 3.845 1.405l2.365-2.365C16.89 3.555 14.69 2.7 12.24 2.7 7.085 2.7 2.9 6.885 2.9 12.04c0 5.155 4.185 9.34 9.34 9.34 4.87 0 8.875-3.535 9.3-8.195H12.24z" />
        </svg>
      </button>

      {/* Botón GitHub */}
      <button
        type="button"
        onClick={() => handleClick('github')}
        aria-label="Iniciar sesión con GitHub"
        className="w-9 h-9 rounded-full grid place-items-center bg-[#14213D] text-white/80 hover:text-[#E9B949] transition-all duration-200 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9B949]"
        style={{
          boxShadow:
            '4px 4px 10px rgba(5, 10, 20, 0.75), -3px -3px 8px rgba(255, 255, 255, 0.04)',
        }}
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
        </svg>
      </button>

      {/* Botón Microsoft */}
      <button
        type="button"
        onClick={() => handleClick('microsoft')}
        aria-label="Iniciar sesión con Microsoft"
        className="w-9 h-9 rounded-full grid place-items-center bg-[#14213D] text-white/80 hover:text-[#E9B949] transition-all duration-200 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9B949]"
        style={{
          boxShadow:
            '4px 4px 10px rgba(5, 10, 20, 0.75), -3px -3px 8px rgba(255, 255, 255, 0.04)',
        }}
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M11.4 2.4H2.4v9h9v-9zm10.2 0h-9v9h9v-9zm-10.2 10.2H2.4v9h9v-9zm10.2 0h-9v9h9v-9z" />
        </svg>
      </button>
    </div>
  );
}
