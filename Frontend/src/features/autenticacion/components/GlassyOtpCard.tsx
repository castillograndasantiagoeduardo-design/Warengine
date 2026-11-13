'use client';

/**
 * GlassyOtpCard.tsx — Tarjeta de Recuperación de Contraseña Glassy OTP V4
 *
 * Implementa con precisión la interfaz de video de referencia:
 * - Tarjeta glassmorphism con esquinas recortadas en diagonal y bordes luminosos.
 * - 4 casillas de un dígito con auto-foco, auto-avance, soporte para pegar y auto-verificación al 4to dígito.
 * - Enlace "Reenviar" con temporizador de 60s.
 * - Pantalla de éxito con escudo verde, confeti de partículas flotantes y "Verificado y Seguro".
 * - Paso final de nueva contraseña con revocación de sesiones.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ApiError } from '@/lib/api';

type PasoRecuperacion = 'EMAIL' | 'OTP' | 'VERIFICADO_EXITO' | 'NUEVA_PASSWORD' | 'COMPLETADO';

interface GlassyOtpCardProps {
  emailInicial?: string;
}

export function GlassyOtpCard({ emailInicial = '' }: GlassyOtpCardProps) {
  const router = useRouter();

  // Estados principales
  const [paso, setPaso] = useState<PasoRecuperacion>(emailInicial ? 'OTP' : 'EMAIL');
  const [email, setEmail] = useState<string>(emailInicial);
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Estados de carga y error
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [intentosRestantes, setIntentosRestantes] = useState<number | null>(null);

  // Reenvío con cooldown de 60 segundos
  const [cooldown, setCooldown] = useState<number>(0);

  // Formulario de nueva contraseña
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Refs de inputs OTP
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Temporizador para el cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Foco inicial en la primera casilla cuando entra a OTP
  useEffect(() => {
    if (paso === 'OTP') {
      setTimeout(() => {
        inputRefs[0]?.current?.focus();
      }, 150);
    }
  }, [paso]);

  // Enmascaramiento de email seguro para UI (ej: "a•••@gmail.com")
  const enmascararEmail = (correo: string): string => {
    const partes = correo.split('@');
    if (partes.length !== 2) return correo;
    const [nombre, dominio] = partes;
    const inicio = nombre.slice(0, 1);
    return `${inicio}•••@${dominio}`;
  };

  // ─── 1. Solicitar código OTP ────────────────────────────────────────────────
  const handleSolicitarCodigo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim() });
      setCooldown(60);
      setDigits(['', '', '', '']);
      setPaso('OTP');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'REENVIO_EN_COOLDOWN') {
          const segs = (err.rawPayload?.segundosRestantes as number) || 60;
          setCooldown(segs);
          setErrorMsg(`Espera ${segs}s antes de solicitar un nuevo código.`);
          setPaso('OTP');
          return;
        }
        setErrorMsg(err.message || 'Error al solicitar el código.');
      } else {
        setErrorMsg('Error de red. Verifica tu conexión.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── 2. Auto-verificación al completar el 4to dígito ─────────────────────────
  const verificarCodigo = useCallback(
    async (codigoCompleto: string) => {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        const res = await apiClient.post<{ resetToken: string }>('/auth/verify-code', {
          email: email.trim(),
          code: codigoCompleto,
        });

        if (res?.resetToken) {
          setResetToken(res.resetToken);
          setPaso('VERIFICADO_EXITO');

          // Transición automática al formulario de nueva contraseña tras ver el estado de éxito
          setTimeout(() => {
            setPaso('NUEVA_PASSWORD');
          }, 2000);
        }
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          const payload = err.rawPayload as { intentosRestantes?: number; segundosRestantes?: number } | undefined;
          if (err.code === 'CODIGO_OTP_BLOQUEADO') {
            setErrorMsg('Has superado los 5 intentos. Código bloqueado. Solicita un nuevo código.');
            setIntentosRestantes(0);
          } else {
            const restantes = payload?.intentosRestantes;
            setIntentosRestantes(restantes ?? null);
            setErrorMsg(
              restantes !== undefined
                ? `Código incorrecto. Te quedan ${restantes} ${restantes === 1 ? 'intento' : 'intentos'}.`
                : err.message || 'Código de verificación incorrecto.',
            );
          }
        } else {
          setErrorMsg('Error al verificar el código.');
        }

        // Limpiar casillas y reenfocar en la primera para corrección rápida
        setDigits(['', '', '', '']);
        setTimeout(() => {
          inputRefs[0]?.current?.focus();
        }, 100);
      } finally {
        setIsLoading(false);
      }
    },
    [email],
  );

  // Manejo de entrada por casilla
  const handleDigitChange = (index: number, val: string) => {
    // Solo permitir números
    const cleanVal = val.replace(/\D/g, '');
    if (!cleanVal && val !== '') return;

    const newDigits = [...digits];

    if (cleanVal.length > 1) {
      // Manejo de pegado en la casilla individual
      const chars = cleanVal.slice(0, 4).split('');
      chars.forEach((ch, idx) => {
        if (index + idx < 4) {
          newDigits[index + idx] = ch;
        }
      });
      setDigits(newDigits);
      const nextFocus = Math.min(index + chars.length, 3);
      inputRefs[nextFocus]?.current?.focus();

      if (newDigits.every((d) => d !== '')) {
        verificarCodigo(newDigits.join(''));
      }
      return;
    }

    newDigits[index] = cleanVal;
    setDigits(newDigits);

    // Auto-avance al siguiente campo
    if (cleanVal && index < 3) {
      inputRefs[index + 1]?.current?.focus();
    }

    // Auto-verificación al completar el 4to dígito
    if (newDigits.every((d) => d !== '') && cleanVal) {
      verificarCodigo(newDigits.join(''));
    }
  };

  // Retroceso inteligente con Backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs[index - 1]?.current?.focus();
      }
    }
  };

  // Soporte directo para evento Paste en el contenedor
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;

    const newDigits = ['', '', '', ''];
    pasted.split('').forEach((ch, idx) => {
      newDigits[idx] = ch;
    });
    setDigits(newDigits);

    const nextIndex = Math.min(pasted.length, 3);
    inputRefs[nextIndex]?.current?.focus();

    if (pasted.length === 4) {
      verificarCodigo(pasted);
    }
  };

  // ─── 3. Restablecer contraseña final ─────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    if (!resetToken) {
      setErrorMsg('Token de sesión no disponible. Por favor reinicia el proceso.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await apiClient.post('/auth/reset-password', {
        resetToken,
        newPassword,
      });

      setPaso('COMPLETADO');
      setTimeout(() => {
        router.push('/acceso');
      }, 2500);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Error al restablecer la contraseña.');
      } else {
        setErrorMsg('Error de conexión.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-[440px] mx-auto p-1 sm:p-2">
      {/* Estilo Glassmorphism con esquinas recortadas (Chamfered HUD) */}
      <div
        className="relative overflow-hidden backdrop-blur-2xl bg-[#091124]/80 border border-cyan-500/30 text-white shadow-[0_0_50px_rgba(6,182,212,0.15)] transition-all duration-500"
        style={{
          clipPath:
            'polygon(28px 0, 100% 0, 100% calc(100% - 28px), calc(100% - 28px) 100%, 0 100%, 0 28px)',
        }}
      >
        {/* Bordes decorativos brillantes en esquinas */}
        <div className="absolute top-0 left-0 w-8 h-[2px] bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
        <div className="absolute top-0 left-0 w-[2px] h-8 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
        <div className="absolute bottom-0 right-0 w-8 h-[2px] bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
        <div className="absolute bottom-0 right-0 w-[2px] h-8 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />

        {/* Gradiente sutil interno */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.07] via-transparent to-blue-600/[0.05] pointer-events-none" />

        <div className="relative p-7 sm:p-8 z-10">
          {/* ═══════════════════════════════════════════════════════════════════
              ESTADO: EMAIL (Pedir correo si no fue provisto)
             ═══════════════════════════════════════════════════════════════════ */}
          {paso === 'EMAIL' && (
            <div className="text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 grid place-items-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                <svg className="w-7 h-7 fill-none stroke-current" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.75"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <h2 className="font-[family-name:var(--font-anton)] text-3xl uppercase tracking-wider text-white mb-2">
                Recuperar <span className="text-cyan-400">Acceso</span>
              </h2>
              <p className="font-[family-name:var(--font-archivo)] text-xs text-white/70 leading-relaxed max-w-[320px] mx-auto mb-6">
                Ingresa tu correo institucional o asociado a Warengine. Te enviaremos un código OTP de 4 dígitos.
              </p>

              {errorMsg && (
                <div className="rounded-xl px-3.5 py-2.5 mb-4 bg-red-950/70 border border-red-500/40 text-red-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSolicitarCodigo} className="space-y-4">
                <div className="rounded-xl px-4 py-3 bg-[#070d1d] border border-white/10 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/30 transition-all text-left">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-white/60 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@warengine.local"
                    className="w-full bg-transparent text-sm text-white placeholder-white/20 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-5 rounded-full font-[family-name:var(--font-ui)] font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Enviando código...' : 'Continuar con Código OTP'}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => router.push('/acceso')}
                  className="text-xs text-white/50 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  &larr; Volver a Iniciar Sesión
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              ESTADO 1 Y 2: GLASSY OTP V4 (Casillas, Auto-verificación y Resend)
             ═══════════════════════════════════════════════════════════════════ */}
          {paso === 'OTP' && (
            <div className="text-center animate-in fade-in duration-300" onPaste={handlePaste}>
              {/* Ícono de Email / Teléfono en recuadro luminoso */}
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 grid place-items-center text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)]">
                <svg className="w-7 h-7 fill-none stroke-current" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.75"
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>

              {/* Título: "Verify Your Email" con palabra en azul/cyan */}
              <h2 className="font-[family-name:var(--font-anton)] text-3xl uppercase tracking-wider text-white mb-2">
                Verifica tu <span className="text-cyan-400">Correo</span>
              </h2>

              {/* Subtítulo con correo enmascarado */}
              <p className="font-[family-name:var(--font-archivo)] text-xs text-white/70 leading-relaxed max-w-[320px] mx-auto mb-6">
                Enviamos un código de 4 dígitos a{' '}
                <strong className="text-cyan-300 font-mono">{enmascararEmail(email)}</strong>. Se
                verificará automáticamente al completarlo.
              </p>

              {/* Aviso de error o intentos */}
              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-xl px-3.5 py-2 mb-4 bg-red-950/70 border border-red-500/50 text-red-300 text-xs animate-in fade-in duration-200"
                >
                  {errorMsg}
                </div>
              )}

              {/* 4 Casillas de Dígitos Conectadas con Líneas Luminosas */}
              <div className="relative flex justify-center items-center gap-3 sm:gap-4 my-6">
                {/* Línea luminosa decorativa detrás que conecta las casillas */}
                <div className="absolute h-[2px] left-6 right-6 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent pointer-events-none" />

                {digits.map((digit, idx) => {
                  const tieneValor = Boolean(digit);
                  return (
                    <div key={idx} className="relative z-10">
                      <input
                        ref={inputRefs[idx]}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        disabled={isLoading}
                        aria-label={`Dígito ${idx + 1}`}
                        className={`w-14 h-16 sm:w-16 sm:h-18 rounded-xl text-center text-2xl sm:text-3xl font-mono font-bold transition-all duration-200 outline-none select-all ${
                          tieneValor
                            ? 'bg-cyan-950/80 text-cyan-300 border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.45)]'
                            : 'bg-[#070d1d] text-white border border-white/15 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        } ${isLoading ? 'opacity-60 animate-pulse' : ''}`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Enlace "Didn't receive the code? Resend" con cuenta regresiva */}
              <div className="mt-6 text-xs text-white/60 font-[family-name:var(--font-archivo)]">
                <span>¿No recibiste el código? </span>
                {cooldown > 0 ? (
                  <span className="text-cyan-400 font-semibold font-mono">
                    Reenviar en {cooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSolicitarCodigo()}
                    disabled={isLoading}
                    className="text-cyan-400 hover:text-cyan-300 underline font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Reenviar
                  </button>
                )}
              </div>

              {/* Botón para cambiar email */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setPaso('EMAIL');
                    setDigits(['', '', '', '']);
                    setErrorMsg(null);
                  }}
                  className="text-[11px] text-white/40 hover:text-white/80 transition-colors"
                >
                  Cambiar correo electrónico
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              ESTADO 3: ÉXITO ("Verified Successfully" + Confeti)
             ═══════════════════════════════════════════════════════════════════ */}
          {paso === 'VERIFICADO_EXITO' && (
            <div className="relative text-center py-4 animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
              {/* Partículas de confeti flotando */}
              <div className="absolute inset-0 pointer-events-none">
                <span className="absolute top-2 left-8 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="absolute top-8 right-10 w-2.5 h-2.5 bg-cyan-400 rotate-45 animate-bounce" />
                <span className="absolute bottom-6 left-12 w-2 h-2 bg-amber-400 rounded-sm animate-pulse" />
                <span className="absolute top-1/2 right-6 w-3 h-1.5 bg-emerald-300 rotate-12" />
                <span className="absolute bottom-10 right-14 w-2 h-2 rounded-full bg-white/80" />
              </div>

              {/* Ícono de Escudo Verde con Check */}
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-950/80 border-2 border-emerald-400 grid place-items-center text-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.5)] animate-in zoom-in-50 duration-300">
                <svg className="w-9 h-9 fill-none stroke-current" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>

              <h2 className="font-[family-name:var(--font-anton)] text-3xl uppercase tracking-wider text-white mb-2">
                Verificado <span className="text-emerald-400">Correctamente</span>
              </h2>

              <p className="font-[family-name:var(--font-archivo)] text-xs text-white/80 leading-relaxed max-w-[300px] mx-auto mb-6">
                Tu identidad ha sido confirmada. Todo listo para restablecer tu contraseña.
              </p>

              {/* Botón o recuadro verde con check */}
              <div className="w-20 h-12 mx-auto rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 mb-6 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Candado: "Verified and Secure" */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold tracking-wider uppercase">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Verificado y Seguro</span>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              ESTADO 4: NUEVA CONTRASEÑA
             ═══════════════════════════════════════════════════════════════════ */}
          {paso === 'NUEVA_PASSWORD' && (
            <div className="animate-in fade-in zoom-in-95 duration-300 text-left">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 grid place-items-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                <svg className="w-6 h-6 fill-none stroke-current" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>

              <h2 className="font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wider text-white text-center mb-1">
                Nueva <span className="text-cyan-400">Contraseña</span>
              </h2>
              <p className="font-[family-name:var(--font-archivo)] text-[11px] text-white/60 text-center mb-5">
                Ingresa y confirma tu nueva clave. Al cambiarla, todas tus sesiones activas se cerrarán.
              </p>

              {errorMsg && (
                <div className="rounded-xl px-3.5 py-2.5 mb-4 bg-red-950/70 border border-red-500/50 text-red-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="rounded-xl px-4 py-2.5 bg-[#070d1d] border border-white/10 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/30 transition-all">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-white/60 mb-1">
                    Nueva Contraseña
                  </label>
                  <div className="flex items-center justify-between">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      maxLength={128}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full bg-transparent text-sm text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="text-white/40 hover:text-cyan-400 text-xs ml-2"
                    >
                      {showPassword ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl px-4 py-2.5 bg-[#070d1d] border border-white/10 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/30 transition-all">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-white/60 mb-1">
                    Confirmar Contraseña
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    maxLength={128}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className="w-full bg-transparent text-sm text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-5 mt-2 rounded-full font-[family-name:var(--font-ui)] font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Actualizando contraseña...' : 'Guardar y Cerrar Sesiones'}
                </button>
              </form>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              ESTADO 5: COMPLETADO
             ═══════════════════════════════════════════════════════════════════ */}
          {paso === 'COMPLETADO' && (
            <div className="text-center py-6 animate-in zoom-in-95 duration-400">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-500/20 text-emerald-400 grid place-items-center text-2xl shadow-[0_0_25px_rgba(16,185,129,0.4)]">
                ✓
              </div>
              <h3 className="font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wider text-white mb-2">
                ¡Contraseña <span className="text-emerald-400">Restablecida!</span>
              </h3>
              <p className="font-[family-name:var(--font-archivo)] text-xs text-white/70 max-w-[280px] mx-auto">
                Tu contraseña ha sido actualizada y tus sesiones previas revocadas. Redirigiendo al inicio de sesión...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
