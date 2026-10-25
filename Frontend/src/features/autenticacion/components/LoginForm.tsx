'use client';

/**
 * LoginForm.tsx — Formulario de inicio de sesión con estética neumórfica y conexión a backend.
 *
 * Principios SOLID aplicados:
 * - Single Responsibility: Encapsula exclusivamente la captura de credenciales y feedback visual.
 * - Single Source of Truth: La validación corre a través del hook useLoginForm con loginSchema de Zod.
 */

import React, { useId } from 'react';
import { useLoginForm } from '../hooks/useLoginForm';
import { SocialAuthButtons } from './SocialAuthButtons';
import { RateLimitNotice } from './RateLimitNotice';
import type { LoginResult } from '../types/auth.types';

interface LoginFormProps {
  isMobile?: boolean;
  onSuccess?: (resultado: LoginResult) => void;
  onForgotPasswordClick?: () => void;
}

export function LoginForm({
  isMobile = false,
  onSuccess,
  onForgotPasswordClick,
}: LoginFormProps) {
  const emailInputId = useId();
  const passwordInputId = useId();
  const rememberCheckboxId = useId();

  const {
    values,
    errors,
    errorGeneral,
    isSubmitting,
    showPassword,
    rateLimit,
    setShowPassword,
    setCampo,
    handleSubmit,
  } = useLoginForm();

  const handleRecuperarPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onForgotPasswordClick) {
      onForgotPasswordClick();
    } else {
      alert('Para restablecer tu contraseña, contacta al administrador de tu sucursal o escribe a soporte@warengine.com.');
    }
  };

  return (
    <div className={`w-full ${isMobile ? 'max-w-[320px]' : 'max-w-[290px]'} mx-auto`}>
      <h1 className="font-[family-name:var(--font-anton)] text-3xl uppercase tracking-wider text-white text-center mb-2.5">
        Iniciar <span className="text-[#E9B949]">Sesión</span>
      </h1>

      {/* Botones Sociales Neumórficos */}
      <SocialAuthButtons />

      <p className="font-[family-name:var(--font-pixelify)] text-[11px] text-center text-white/60 uppercase tracking-widest mb-3">
        o usa tu correo institucional
      </p>

      {/* Aviso de Bloqueo por Fuerza Bruta (429) */}
      {rateLimit.bloqueado && (
        <RateLimitNotice
          mensaje={rateLimit.mensaje}
          tiempoRestanteSegundos={rateLimit.tiempoRestanteSegundos}
        />
      )}

      {/* Error General de API (ej. credenciales inválidas o cuenta inactiva) */}
      {errorGeneral && !rateLimit.bloqueado && (
        <div
          role="alert"
          className="rounded-xl px-3.5 py-2.5 mb-3 bg-red-950/60 border border-red-500/30 text-red-300 text-[11px] font-[family-name:var(--font-archivo)] leading-snug animate-in fade-in duration-200"
          style={{
            boxShadow:
              'inset 2px 2px 4px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.03)',
          }}
        >
          {errorGeneral}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, onSuccess)} noValidate className="space-y-3">
        {/* Campo Email Hundido */}
        <div>
          <label
            htmlFor={emailInputId}
            className="block font-[family-name:var(--font-pixelify)] text-[11px] uppercase tracking-wider text-white/80 mb-1"
          >
            Correo electrónico
          </label>
          <div
            className={`rounded-xl px-3.5 py-2 bg-[#0f192e] border transition-all ${
              errors.email
                ? 'border-red-500/70 focus-within:ring-2 focus-within:ring-red-500/30'
                : 'border-white/[0.04] focus-within:border-[#E9B949]/70 focus-within:ring-2 focus-within:ring-[#E9B949]/30'
            }`}
            style={{
              boxShadow:
                'inset 3px 3px 6px rgba(0,0,0,0.55), inset -2px -2px 5px rgba(255,255,255,0.035)',
            }}
          >
            <input
              id={emailInputId}
              type="email"
              value={values.email}
              onChange={(e) => setCampo('email', e.target.value)}
              placeholder="usuario@empresa.com"
              autoComplete="email"
              disabled={isSubmitting || rateLimit.bloqueado}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? `${emailInputId}-error` : undefined}
              className="w-full bg-transparent text-xs text-white placeholder-white/30 focus:outline-none font-[family-name:var(--font-archivo)] disabled:opacity-50"
            />
          </div>
          {errors.email && (
            <p
              id={`${emailInputId}-error`}
              className="text-red-400 font-[family-name:var(--font-archivo)] text-[11px] mt-1"
            >
              {errors.email}
            </p>
          )}
        </div>

        {/* Campo Contraseña Hundido */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor={passwordInputId}
              className="block font-[family-name:var(--font-pixelify)] text-[11px] uppercase tracking-wider text-white/80"
            >
              Contraseña
            </label>
            <a
              href="#recuperar"
              onClick={handleRecuperarPassword}
              className="font-[family-name:var(--font-pixelify)] text-[10px] text-[#E9B949]/80 hover:text-[#E9B949] transition-colors focus-visible:outline-none focus-visible:underline"
            >
              ¿Olvidaste?
            </a>
          </div>
          <div
            className={`flex items-center rounded-xl px-3.5 py-2 bg-[#0f192e] border transition-all ${
              errors.password
                ? 'border-red-500/70 focus-within:ring-2 focus-within:ring-red-500/30'
                : 'border-white/[0.04] focus-within:border-[#E9B949]/70 focus-within:ring-2 focus-within:ring-[#E9B949]/30'
            }`}
            style={{
              boxShadow:
                'inset 3px 3px 6px rgba(0,0,0,0.55), inset -2px -2px 5px rgba(255,255,255,0.035)',
            }}
          >
            <input
              id={passwordInputId}
              type={showPassword ? 'text' : 'password'}
              value={values.password}
              onChange={(e) => setCampo('password', e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isSubmitting || rateLimit.bloqueado}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? `${passwordInputId}-error` : undefined}
              className="w-full bg-transparent text-xs text-white placeholder-white/30 focus:outline-none font-[family-name:var(--font-archivo)] disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="text-white/40 hover:text-[#E9B949] ml-2 transition-colors focus-visible:outline-none cursor-pointer"
            >
              {showPassword ? (
                <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                  />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p
              id={`${passwordInputId}-error`}
              className="text-red-400 font-[family-name:var(--font-archivo)] text-[11px] mt-1"
            >
              {errors.password}
            </p>
          )}
        </div>

        {/* Checkbox 'Recordarme' (Extiende sesión a 30 días según RF-SA-G4) */}
        <div className="flex items-center gap-2 pt-0.5">
          <input
            id={rememberCheckboxId}
            type="checkbox"
            checked={values.recordarme}
            onChange={(e) => setCampo('recordarme', e.target.checked)}
            disabled={isSubmitting || rateLimit.bloqueado}
            className="w-3.5 h-3.5 rounded bg-[#0f192e] border border-white/20 text-[#E9B949] focus:ring-[#E9B949] accent-[#E9B949] cursor-pointer"
          />
          <label
            htmlFor={rememberCheckboxId}
            className="text-[11px] text-white/70 font-[family-name:var(--font-archivo)] select-none cursor-pointer hover:text-white transition-colors"
          >
            Recordar mi dispositivo (30 días)
          </label>
        </div>

        {/* Botón Píldora Primario Dorado con Hover Invertido y Spinner */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || rateLimit.bloqueado}
            className="w-full rounded-full py-2.5 px-5 font-[family-name:var(--font-pixelify)] font-bold text-xs uppercase tracking-wider bg-[#E9B949] text-[#14213D] hover:bg-[#14213D] hover:text-white hover:border hover:border-[#E9B949]/60 active:scale-[0.98] transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9B949]"
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
                <span>Autenticando...</span>
              </>
            ) : (
              <span>Ingresar al Sistema</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
