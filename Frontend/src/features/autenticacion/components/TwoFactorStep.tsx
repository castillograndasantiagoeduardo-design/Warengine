'use client';

/**
 * TwoFactorStep.tsx — Paso de verificación de segundo factor (2FA TOTP RFC 6238).
 *
 * Principio SOLID:
 * - Single Responsibility: Controla la vista interactiva para el código de 6 dígitos
 *   cuando el backend devuelve HTTP 428 (REQUIERE_2FA).
 */

import React, { useId } from 'react';
import { useTwoFactorForm } from '../hooks/useTwoFactorForm';
import { RateLimitNotice } from './RateLimitNotice';

interface TwoFactorStepProps {
  onSuccess?: () => void;
}

export function TwoFactorStep({ onSuccess }: TwoFactorStepProps) {
  const totpInputId = useId();
  const {
    codigoTotp,
    error,
    isSubmitting,
    rateLimit,
    mensajeInstruccion,
    handleCodigoChange,
    handleSubmit,
    cancelar,
  } = useTwoFactorForm();

  return (
    <div className="w-full max-w-[320px] mx-auto py-2 animate-in fade-in zoom-in-95 duration-300">
      <div className="text-center mb-4">
        {/* Ícono de Escudo 2FA */}
        <div
          className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-[#0f192e] border border-white/[0.08] grid place-items-center text-[#E9B949]"
          style={{
            boxShadow:
              'inset 3px 3px 6px rgba(0,0,0,0.6), inset -2px -2px 5px rgba(255,255,255,0.04)',
          }}
        >
          <svg className="w-6 h-6 fill-none stroke-current" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>

        <h2 className="font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wider text-white">
          Segundo <span className="text-[#E9B949]">Factor</span>
        </h2>
        <p className="font-[family-name:var(--font-archivo)] text-[11px] text-white/70 leading-relaxed mt-1">
          {mensajeInstruccion ||
            'Ingresa el código de 6 dígitos generado por tu aplicación autenticadora (Google Authenticator, Authy o Microsoft Authenticator).'}
        </p>
      </div>

      {rateLimit.bloqueado && (
        <RateLimitNotice
          mensaje={rateLimit.mensaje}
          tiempoRestanteSegundos={rateLimit.tiempoRestanteSegundos}
        />
      )}

      <form
        onSubmit={(e) => handleSubmit(e, onSuccess)}
        noValidate
        className="space-y-4"
      >
        <div>
          <label
            htmlFor={totpInputId}
            className="block text-center font-[family-name:var(--font-ui)] text-[11px] uppercase tracking-widest text-white/80 mb-1.5"
          >
            Código de 6 Dígitos
          </label>
          <div
            className="rounded-xl px-4 py-3 bg-[#0f192e] border border-white/[0.04] transition-all focus-within:border-[#E9B949]/70 focus-within:ring-2 focus-within:ring-[#E9B949]/30"
            style={{
              boxShadow:
                'inset 3px 3px 6px rgba(0,0,0,0.55), inset -2px -2px 5px rgba(255,255,255,0.035)',
            }}
          >
            <input
              id={totpInputId}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={codigoTotp}
              onChange={(e) => handleCodigoChange(e.target.value)}
              placeholder="000000"
              autoFocus
              disabled={isSubmitting || rateLimit.bloqueado}
              className="w-full bg-transparent text-center font-mono text-2xl font-bold tracking-[0.45em] text-[#E9B949] placeholder-white/20 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-red-400 font-[family-name:var(--font-archivo)] text-[11px] text-center mt-2 animate-shake">
              {error}
            </p>
          )}
        </div>

        {/* Botón Primario de Validación */}
        <button
          type="submit"
          disabled={isSubmitting || rateLimit.bloqueado || codigoTotp.length !== 6}
          className="w-full rounded-full py-2.5 px-5 font-[family-name:var(--font-ui)] font-bold text-xs uppercase tracking-wider bg-[#E9B949] text-[#14213D] hover:bg-[#14213D] hover:text-white hover:border hover:border-[#E9B949]/60 active:scale-[0.98] transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            boxShadow:
              '5px 5px 12px rgba(0,0,0,0.45), -3px -3px 10px rgba(255,255,255,0.06)',
          }}
        >
          {isSubmitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Verificando...</span>
            </>
          ) : (
            <span>Verificar Código</span>
          )}
        </button>

        {/* Botón Secundario: Cancelar y volver al inicio de sesión */}
        <button
          type="button"
          onClick={cancelar}
          disabled={isSubmitting}
          className="w-full text-center font-[family-name:var(--font-ui)] text-[11px] text-white/60 hover:text-white transition-colors cursor-pointer py-1"
        >
          &larr; Volver al inicio de sesión
        </button>
      </form>
    </div>
  );
}
