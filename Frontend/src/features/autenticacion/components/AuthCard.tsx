'use client';

/**
 * AuthCard.tsx — Tarjeta de autenticación neumórfica para WarEngine.
 *
 * Principios SOLID aplicados:
 * - Single Responsibility Principle (SRP): Orquesta los subcomponentes especializados
 *   (LoginForm, TwoFactorStep, RegisterNotice, AuthOverlay) según el dispositivo y el flujo de sesión.
 * - Open/Closed Principle (OCP): Permite extender nuevos métodos de autenticación sin modificar
 *   el árbol estructural de la tarjeta.
 *
 * Mantiene intacto el 100% del diseño neumórfico original, colores corporativos y animaciones.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from './LoginForm';
import { TwoFactorStep } from './TwoFactorStep';
import { RegisterNotice } from './RegisterNotice';
import { AuthOverlay } from './AuthOverlay';
import type { LoginResult } from '../types/auth.types';

type AuthMode = 'login' | 'registro';

export function AuthCard() {
  const router = useRouter();
  const { paso2FA, usuario } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [rolError, setRolError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'acceso_denegado_sucursal') {
        setRolError(
          'Acceso restringido: El dashboard actual está reservado exclusivamente para cuentas con rol "admin-sucursal". Inicie sesión con una cuenta de Administrador de Sucursal.'
        );
      }
    }
  }, []);

  const isLogin = mode === 'login';

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'registro' : 'login'));
  };

  const handleAuthSuccess = (resultado?: LoginResult) => {
    // Si la respuesta requiere 2FA, no redirigir todavía (el estado paso2FA mostrará TwoFactorStep)
    if (resultado?.tipo === 'REQUIERE_2FA') {
      return;
    }

    const rol = resultado?.tipo === 'EXITO' ? resultado.data.usuario.rolNombre : usuario?.rolNombre;

    // Redirección inteligente post-login según el rol
    if (rol === 'cajero') {
      router.push('/pos');
    } else if (rol === 'vendedor-b2b') {
      router.push('/vendedor-b2b');
    } else if (rol === 'admin-sucursal') {
      router.push('/admin-sucursal');
    } else if (rol === 'super-admin' || rol === 'superadmin') {
      router.push('/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="relative w-full max-w-[780px] mx-auto px-3 sm:px-4">
      {/* Banner de restricción de rol */}
      {rolError && (
        <div
          role="alert"
          className="mb-4 p-4 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs font-[family-name:var(--font-archivo)] shadow-2xl flex items-start gap-3 backdrop-blur-md animate-in fade-in duration-300"
        >
          <span className="text-xl leading-none">⚠️</span>
          <div className="flex-1">
            <h4 className="font-semibold text-amber-400 uppercase tracking-wider text-xs font-[family-name:var(--font-pixelify)] mb-1">
              Restricción de Perfil y Acceso
            </h4>
            <p className="leading-relaxed text-amber-200/90">{rolError}</p>
          </div>
          <button
            onClick={() => setRolError(null)}
            className="text-amber-400 hover:text-white transition-colors text-xs font-mono px-1.5 py-0.5 rounded cursor-pointer"
            aria-label="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}

      {/* Anunciador aria-live para accesibilidad de lectores de pantalla */}
      <div className="sr-only" aria-live="polite">
        {paso2FA
          ? 'Modo actual: Verificación de segundo factor 2FA'
          : isLogin
          ? 'Modo actual: Iniciar sesión'
          : 'Modo actual: Crear cuenta'}
      </div>

      {/* Tarjeta Neumórfica Principal */}
      <div
        className="relative w-full rounded-[22px] sm:rounded-[26px] overflow-hidden bg-[#14213D] border border-white/[0.06] transition-all duration-300"
        style={{
          boxShadow:
            '16px 16px 36px rgba(5, 10, 20, 0.8), -10px -10px 28px rgba(255, 255, 255, 0.035), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Curvas orgánicas vectoriales abstractas de fondo */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25 select-none">
          <svg
            className="absolute -top-20 -left-20 w-80 h-80 text-[#e9b949]/10"
            viewBox="0 0 400 400"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M50 150 C 120 40, 280 60, 320 180 C 360 300, 220 380, 100 340 C -20 300, -20 260, 50 150 Z"
              fill="currentColor"
            />
          </svg>
          <svg
            className="absolute -bottom-24 -right-24 w-88 h-88 text-white/[0.03]"
            viewBox="0 0 500 500"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M100 200 C 180 80, 380 90, 420 220 C 460 350, 350 450, 200 440 C 50 430, 20 320, 100 200 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* ============================================================== */}
        {/* LAYOUT ESCRITORIO (>= 1024px): Doble Panel + Overlay Deslizante */}
        {/* ============================================================== */}
        <div className="hidden lg:grid grid-cols-2 relative min-h-[500px] z-10">
          {/* Panel Izquierdo: Login o Segundo Factor 2FA */}
          <div
            className={`flex flex-col justify-center px-8 py-7 transition-all duration-600 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
              isLogin ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'
            }`}
            aria-hidden={!isLogin}
          >
            {paso2FA ? (
              <TwoFactorStep onSuccess={handleAuthSuccess} />
            ) : (
              <LoginForm onSuccess={handleAuthSuccess} />
            )}
          </div>

          {/* Panel Derecho: Información de Registro / Acceso Corporativo */}
          <div
            className={`flex flex-col justify-center px-8 py-7 transition-all duration-600 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
              !isLogin ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'
            }`}
            aria-hidden={isLogin}
          >
            <RegisterNotice onSwitchToLogin={() => setMode('login')} />
          </div>

          {/* Panel Overlay Deslizante */}
          {!paso2FA && <AuthOverlay isLogin={isLogin} onToggleMode={toggleMode} />}
        </div>

        {/* ============================================================== */}
        {/* LAYOUT MÓVIL (< 1024px): Formulario Centrado con Toggle        */}
        {/* ============================================================== */}
        <div className="block lg:hidden px-5 py-6 relative z-10">
          {paso2FA ? (
            <TwoFactorStep onSuccess={handleAuthSuccess} />
          ) : isLogin ? (
            <div>
              <LoginForm isMobile onSuccess={handleAuthSuccess} />

              {/* Toggle a Solicitar Acceso en Móvil */}
              <div className="mt-5 pt-4 border-t border-white/[0.08] text-center">
                <p className="font-[family-name:var(--font-archivo)] text-[11px] text-white/60 mb-1.5">
                  ¿Necesitas una cuenta institucional?
                </p>
                <button
                  type="button"
                  onClick={toggleMode}
                  className="min-h-[40px] px-5 py-1.5 rounded-full border border-white/40 text-white font-[family-name:var(--font-pixelify)] text-[11px] uppercase tracking-wider cursor-pointer hover:border-[#E9B949] hover:text-[#E9B949] transition-colors"
                >
                  Solicitar acceso
                </button>
              </div>
            </div>
          ) : (
            <div>
              <RegisterNotice isMobile onSwitchToLogin={() => setMode('login')} />

              {/* Switch Móvil a Iniciar Sesión */}
              <div className="mt-5 pt-4 border-t border-white/[0.08] text-center">
                <p className="font-[family-name:var(--font-archivo)] text-[11px] text-white/60 mb-1.5">
                  ¿Ya tienes una cuenta activa en WarEngine?
                </p>
                <button
                  type="button"
                  onClick={toggleMode}
                  className="min-h-[40px] px-5 py-1.5 rounded-full border border-white/40 text-white font-[family-name:var(--font-pixelify)] text-[11px] uppercase tracking-wider cursor-pointer hover:border-[#E9B949] hover:text-[#E9B949] transition-colors"
                >
                  Iniciar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
