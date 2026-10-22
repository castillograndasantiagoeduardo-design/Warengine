'use client';

import React, { useState, useId } from 'react';

type AuthMode = 'login' | 'registro';

interface FormState {
  nombre: string;
  email: string;
  password: string;
}

interface FormErrors {
  nombre?: string;
  email?: string;
  password?: string;
}

export function AuthCard() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Estados de formularios
  const [loginState, setLoginState] = useState<FormState>({
    nombre: '',
    email: '',
    password: '',
  });
  const [loginErrors, setLoginErrors] = useState<FormErrors>({});

  const [registerState, setRegisterState] = useState<FormState>({
    nombre: '',
    email: '',
    password: '',
  });
  const [registerErrors, setRegisterErrors] = useState<FormErrors>({});

  const isLogin = mode === 'login';

  // Ids únicos para accesibilidad
  const loginEmailId = useId();
  const loginPassId = useId();
  const regNombreId = useId();
  const regEmailId = useId();
  const regPassId = useId();

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'registro' : 'login'));
    setLoginErrors({});
    setRegisterErrors({});
    setSubmitted(false);
  };

  // Validaciones
  const validateEmail = (val: string): string | undefined => {
    if (!val.trim()) return 'El correo electrónico es obligatorio';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) return 'Ingresa un correo electrónico válido';
    return undefined;
  };

  const validatePassword = (val: string): string | undefined => {
    if (!val) return 'La contraseña es obligatoria';
    if (val.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    return undefined;
  };

  const validateNombre = (val: string): string | undefined => {
    if (!val.trim()) return 'El nombre completo es obligatorio';
    if (val.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
    return undefined;
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(loginState.email);
    const passErr = validatePassword(loginState.password);

    if (emailErr || passErr) {
      setLoginErrors({ email: emailErr, password: passErr });
      return;
    }

    setLoginErrors({});
    setSubmitted(true);

    // TODO: Conectar autenticación backend (POST /api/auth/login)
    console.log('[AuthCard] Iniciar sesión enviado:', { email: loginState.email });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nombreErr = validateNombre(registerState.nombre);
    const emailErr = validateEmail(registerState.email);
    const passErr = validatePassword(registerState.password);

    if (nombreErr || emailErr || passErr) {
      setRegisterErrors({ nombre: nombreErr, email: emailErr, password: passErr });
      return;
    }

    setRegisterErrors({});
    setSubmitted(true);

    // TODO: Conectar autenticación backend (POST /api/auth/register)
    console.log('[AuthCard] Registro enviado:', {
      nombre: registerState.nombre,
      email: registerState.email,
    });
  };

  return (
    <div className="relative w-full max-w-[780px] mx-auto px-3 sm:px-4">
      {/* Anunciador aria-live para accesibilidad en lectores de pantalla */}
      <div className="sr-only" aria-live="polite">
        {isLogin ? 'Modo actual: Iniciar sesión' : 'Modo actual: Crear cuenta'}
      </div>

      {/* Tarjeta Neumórfica Principal Compacta */}
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
          {/* Panel Izquierdo: Formulario de Iniciar Sesión */}
          <div
            className={`flex flex-col justify-center px-8 py-7 transition-all duration-600 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
              isLogin ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'
            }`}
            aria-hidden={!isLogin}
            inert={!isLogin}
          >
            <div className="max-w-[290px] w-full mx-auto">
              <h1 className="font-[family-name:var(--font-anton)] text-3xl uppercase tracking-wider text-white text-center mb-2.5">
                Iniciar <span className="text-[#E9B949]">Sesión</span>
              </h1>

              {/* Iconos Sociales en Relieve */}
              <div className="flex items-center justify-center gap-3 mb-3">
                <button
                  type="button"
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
                <button
                  type="button"
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
                <button
                  type="button"
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

              <p className="font-[family-name:var(--font-pixelify)] text-[11px] text-center text-white/60 uppercase tracking-widest mb-3">
                o usa tu correo institucional
              </p>

              <form onSubmit={handleLoginSubmit} noValidate className="space-y-3">
                {/* Input Email Hundido */}
                <div>
                  <label
                    htmlFor={loginEmailId}
                    className="block font-[family-name:var(--font-pixelify)] text-[11px] uppercase tracking-wider text-white/80 mb-1"
                  >
                    Correo electrónico
                  </label>
                  <div
                    className="rounded-xl px-3.5 py-2 bg-[#0f192e] border border-white/[0.04] transition-all focus-within:border-[#E9B949]/70 focus-within:ring-2 focus-within:ring-[#E9B949]/30"
                    style={{
                      boxShadow:
                        'inset 3px 3px 6px rgba(0,0,0,0.55), inset -2px -2px 5px rgba(255,255,255,0.035)',
                    }}
                  >
                    <input
                      id={loginEmailId}
                      type="email"
                      value={loginState.email}
                      onChange={(e) =>
                        setLoginState((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="usuario@empresa.com"
                      autoComplete="email"
                      aria-invalid={!!loginErrors.email}
                      aria-describedby={loginErrors.email ? `${loginEmailId}-error` : undefined}
                      className="w-full bg-transparent text-xs text-white placeholder-white/30 focus:outline-none font-[family-name:var(--font-archivo)]"
                    />
                  </div>
                  {loginErrors.email && (
                    <p
                      id={`${loginEmailId}-error`}
                      className="text-red-400 font-[family-name:var(--font-archivo)] text-[11px] mt-1"
                    >
                      {loginErrors.email}
                    </p>
                  )}
                </div>

                {/* Input Contraseña Hundido */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor={loginPassId}
                      className="block font-[family-name:var(--font-pixelify)] text-[11px] uppercase tracking-wider text-white/80"
                    >
                      Contraseña
                    </label>
                    <a
                      href="#recuperar"
                      onClick={(e) => {
                        e.preventDefault();
                        alert('Redirigiendo a recuperación de contraseña...');
                      }}
                      className="font-[family-name:var(--font-pixelify)] text-[10px] text-[#E9B949]/80 hover:text-[#E9B949] transition-colors focus-visible:outline-none focus-visible:underline"
                    >
                      ¿Olvidaste?
                    </a>
                  </div>
                  <div
                    className="flex items-center rounded-xl px-3.5 py-2 bg-[#0f192e] border border-white/[0.04] transition-all focus-within:border-[#E9B949]/70 focus-within:ring-2 focus-within:ring-[#E9B949]/30"
                    style={{
                      boxShadow:
                        'inset 3px 3px 6px rgba(0,0,0,0.55), inset -2px -2px 5px rgba(255,255,255,0.035)',
                    }}
                  >
                    <input
                      id={loginPassId}
                      type={showPassword ? 'text' : 'password'}
                      value={loginState.password}
                      onChange={(e) =>
                        setLoginState((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="••••••••"
                      autoComplete="current-password"
                      aria-invalid={!!loginErrors.password}
                      aria-describedby={loginErrors.password ? `${loginPassId}-error` : undefined}
                      className="w-full bg-transparent text-xs text-white placeholder-white/30 focus:outline-none font-[family-name:var(--font-archivo)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="text-white/40 hover:text-[#E9B949] ml-2 transition-colors focus-visible:outline-none"
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
                  {loginErrors.password && (
                    <p
                      id={`${loginPassId}-error`}
                      className="text-red-400 font-[family-name:var(--font-archivo)] text-[11px] mt-1"
                    >
                      {loginErrors.password}
                    </p>
                  )}
                </div>

                {/* Botón Píldora Primario (Dorado dominante con hover invertido) */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full rounded-full py-2.5 px-5 font-[family-name:var(--font-pixelify)] font-bold text-xs uppercase tracking-wider bg-[#E9B949] text-[#14213D] hover:bg-[#14213D] hover:text-white hover:border hover:border-[#E9B949]/60 active:scale-[0.98] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9B949]"
                    style={{
                      boxShadow:
                        '5px 5px 12px rgba(0,0,0,0.45), -3px -3px 10px rgba(255,255,255,0.06)',
                    }}
                  >
                    Ingresar al Sistema
                  </button>
                </div>
              </form>

              {submitted && isLogin && (
                <p className="text-[#E9B949] font-[family-name:var(--font-archivo)] text-[11px] text-center mt-2.5 animate-pulse">
                  ✓ Validación local exitosa.
                </p>
              )}
            </div>
          </div>

          {/* Panel Derecho: Formulario de Registro */}
          <div
            className={`flex flex-col justify-center px-8 py-7 transition-all duration-600 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
              !isLogin ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'
            }`}
            aria-hidden={isLogin}
            inert={isLogin}
          >
            <div className="max-w-[290px] w-full mx-auto">
              <h2 className="font-[family-name:var(--font-anton)] text-3xl uppercase tracking-wider text-white text-center mb-2">
                Crear <span className="text-[#E9B949]">Cuenta</span>
              </h2>

              {/* Iconos Sociales en Relieve */}
              <div className="flex items-center justify-center gap-3 mb-2.5">
                <button
                  type="button"
                  aria-label="Registrarse con Google"
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
                <button
                  type="button"
                  aria-label="Registrarse con GitHub"
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
                <button
                  type="button"
                  aria-label="Registrarse con Microsoft"
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

              <p className="font-[family-name:var(--font-pixelify)] text-[11px] text-center text-white/60 uppercase tracking-widest mb-2.5">
                o usa tu correo institucional
              </p>

              <form onSubmit={handleRegisterSubmit} noValidate className="space-y-2.5">
                {/* Input Nombre Hundido */}
                <div>
                  <label
                    htmlFor={regNombreId}
                    className="block font-[family-name:var(--font-pixelify)] text-[11px] uppercase tracking-wider text-white/80 mb-0.5"
                  >
                    Nombre Completo
                  </label>
                  <div
                    className="rounded-xl px-3.5 py-1.5 bg-[#0f192e] border border-white/[0.04] transition-all focus-within:border-[#E9B949]/70 focus-within:ring-2 focus-within:ring-[#E9B949]/30"
                    style={{
                      boxShadow:
                        'inset 3px 3px 6px rgba(0,0,0,0.55), inset -2px -2px 5px rgba(255,255,255,0.035)',
                    }}
                  >
                    <input
                      id={regNombreId}
                      type="text"
                      value={registerState.nombre}
                      onChange={(e) =>
                        setRegisterState((prev) => ({ ...prev, nombre: e.target.value }))
                      }
                      placeholder="Santiago Granda"
                      autoComplete="name"
                      aria-invalid={!!registerErrors.nombre}
                      aria-describedby={registerErrors.nombre ? `${regNombreId}-error` : undefined}
                      className="w-full bg-transparent text-xs text-white placeholder-white/30 focus:outline-none font-[family-name:var(--font-archivo)]"
                    />
                  </div>
                  {registerErrors.nombre && (
                    <p
                      id={`${regNombreId}-error`}
                      className="text-red-400 font-[family-name:var(--font-archivo)] text-[11px] mt-0.5"
                    >
                      {registerErrors.nombre}
                    </p>
                  )}
                </div>

                {/* Input Email Hundido */}
                <div>
                  <label
                    htmlFor={regEmailId}
                    className="block font-[family-name:var(--font-pixelify)] text-[11px] uppercase tracking-wider text-white/80 mb-0.5"
                  >
                    Correo electrónico
                  </label>
                  <div
                    className="rounded-xl px-3.5 py-1.5 bg-[#0f192e] border border-white/[0.04] transition-all focus-within:border-[#E9B949]/70 focus-within:ring-2 focus-within:ring-[#E9B949]/30"
                    style={{
                      boxShadow:
                        'inset 3px 3px 6px rgba(0,0,0,0.55), inset -2px -2px 5px rgba(255,255,255,0.035)',
                    }}
                  >
                    <input
                      id={regEmailId}
                      type="email"
                      value={registerState.email}
                      onChange={(e) =>
                        setRegisterState((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="usuario@empresa.com"
                      autoComplete="email"
                      aria-invalid={!!registerErrors.email}
                      aria-describedby={registerErrors.email ? `${regEmailId}-error` : undefined}
                      className="w-full bg-transparent text-xs text-white placeholder-white/30 focus:outline-none font-[family-name:var(--font-archivo)]"
                    />
                  </div>
                  {registerErrors.email && (
                    <p
                      id={`${regEmailId}-error`}
                      className="text-red-400 font-[family-name:var(--font-archivo)] text-[11px] mt-0.5"
                    >
                      {registerErrors.email}
                    </p>
                  )}
                </div>

                {/* Input Contraseña Hundido */}
                <div>
                  <label
                    htmlFor={regPassId}
                    className="block font-[family-name:var(--font-pixelify)] text-[11px] uppercase tracking-wider text-white/80 mb-0.5"
                  >
                    Contraseña
                  </label>
                  <div
                    className="flex items-center rounded-xl px-3.5 py-1.5 bg-[#0f192e] border border-white/[0.04] transition-all focus-within:border-[#E9B949]/70 focus-within:ring-2 focus-within:ring-[#E9B949]/30"
                    style={{
                      boxShadow:
                        'inset 3px 3px 6px rgba(0,0,0,0.55), inset -2px -2px 5px rgba(255,255,255,0.035)',
                    }}
                  >
                    <input
                      id={regPassId}
                      type={showPassword ? 'text' : 'password'}
                      value={registerState.password}
                      onChange={(e) =>
                        setRegisterState((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="••••••••"
                      autoComplete="new-password"
                      aria-invalid={!!registerErrors.password}
                      aria-describedby={registerErrors.password ? `${regPassId}-error` : undefined}
                      className="w-full bg-transparent text-xs text-white placeholder-white/30 focus:outline-none font-[family-name:var(--font-archivo)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="text-white/40 hover:text-[#E9B949] ml-2 transition-colors focus-visible:outline-none"
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
                  {registerErrors.password && (
                    <p
                      id={`${regPassId}-error`}
                      className="text-red-400 font-[family-name:var(--font-archivo)] text-[11px] mt-0.5"
                    >
                      {registerErrors.password}
                    </p>
                  )}
                </div>

                {/* Botón Píldora Primario (Dorado dominante con hover invertido) */}
                <div className="pt-1.5">
                  <button
                    type="submit"
                    className="w-full rounded-full py-2.5 px-5 font-[family-name:var(--font-pixelify)] font-bold text-xs uppercase tracking-wider bg-[#E9B949] text-[#14213D] hover:bg-[#14213D] hover:text-white hover:border hover:border-[#E9B949]/60 active:scale-[0.98] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9B949]"
                    style={{
                      boxShadow:
                        '5px 5px 12px rgba(0,0,0,0.45), -3px -3px 10px rgba(255,255,255,0.06)',
                    }}
                  >
                    Registrar Cuenta
                  </button>
                </div>
              </form>

              {submitted && !isLogin && (
                <p className="text-[#E9B949] font-[family-name:var(--font-archivo)] text-[11px] text-center mt-2 animate-pulse">
                  ✓ Registro validado con éxito.
                </p>
              )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* PANEL OVERLAY DESLIZANTE (DESKTOP) */}
          {/* ============================================================== */}
          <div
            className="absolute top-0 bottom-0 left-0 w-1/2 z-20 overflow-hidden rounded-[22px] sm:rounded-[26px] transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] will-change-transform"
            style={{
              transform: isLogin ? 'translateX(100%)' : 'translateX(0%)',
              background:
                'linear-gradient(135deg, #101a30 0%, #172442 50%, #0d1627 100%)',
              boxShadow: isLogin
                ? '-8px 0 28px rgba(0, 0, 0, 0.65), inset 1px 0 0 rgba(255, 255, 255, 0.08)'
                : '8px 0 28px rgba(0, 0, 0, 0.65), inset -1px 0 0 rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* Formas orgánicas abstractas exclusivas del overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <svg
                className="absolute -top-16 -right-16 w-64 h-64 text-[#e9b949]/15"
                viewBox="0 0 300 300"
                fill="none"
              >
                <circle cx="150" cy="150" r="120" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
                <path d="M40 150 Q 150 20 260 150 T 40 150" fill="currentColor" fillOpacity="0.1" />
              </svg>
              <svg
                className="absolute -bottom-20 -left-16 w-64 h-64 text-white/5"
                viewBox="0 0 300 300"
                fill="none"
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
                  Ingresa tus datos personales y comienza hoy mismo a optimizar la gestión comercial de tu empresa con WarEngine.
                </p>
                <button
                  type="button"
                  onClick={toggleMode}
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
                  Para mantenerte conectado con tus módulos y sucursales, por favor inicia sesión con las credenciales de tu cuenta.
                </p>
                <button
                  type="button"
                  onClick={toggleMode}
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
        </div>

        {/* ============================================================== */}
        {/* LAYOUT MÓVIL (< 1024px): Un solo formulario centrado con Toggle */}
        {/* ============================================================== */}
        <div className="block lg:hidden px-5 py-6 relative z-10">
          {/* Formulario Login Móvil */}
          {isLogin ? (
            <div className="w-full max-w-[320px] mx-auto">
              <h1 className="font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wider text-white text-center mb-2.5">
                Iniciar <span className="text-[#E9B949]">Sesión</span>
              </h1>

              {/* Redes Sociales */}
              <div className="flex items-center justify-center gap-2.5 mb-3">
                <button
                  type="button"
                  aria-label="Iniciar sesión con Google"
                  className="w-9 h-9 rounded-full grid place-items-center bg-[#14213D] text-white/80 active:scale-95"
                  style={{
                    boxShadow:
                      '3px 3px 8px rgba(0,0,0,0.7), -2px -2px 6px rgba(255,255,255,0.04)',
                  }}
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887C18.2 16.14 15.645 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.465 0 2.805.53 3.845 1.405l2.365-2.365C16.89 3.555 14.69 2.7 12.24 2.7 7.085 2.7 2.9 6.885 2.9 12.04c0 5.155 4.185 9.34 9.34 9.34 4.87 0 8.875-3.535 9.3-8.195H12.24z" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Iniciar sesión con GitHub"
                  className="w-9 h-9 rounded-full grid place-items-center bg-[#14213D] text-white/80 active:scale-95"
                  style={{
                    boxShadow:
                      '3px 3px 8px rgba(0,0,0,0.7), -2px -2px 6px rgba(255,255,255,0.04)',
                  }}
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Iniciar sesión con Microsoft"
                  className="w-9 h-9 rounded-full grid place-items-center bg-[#14213D] text-white/80 active:scale-95"
                  style={{
                    boxShadow:
                      '3px 3px 8px rgba(0,0,0,0.7), -2px -2px 6px rgba(255,255,255,0.04)',
                  }}
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M11.4 2.4H2.4v9h9v-9zm10.2 0h-9v9h9v-9zm-10.2 10.2H2.4v9h9v-9zm10.2 0h-9v9h9v-9z" />
                  </svg>
                </button>
              </div>

              <p className="font-[family-name:var(--font-pixelify)] text-[10px] text-center text-white/60 uppercase tracking-widest mb-3">
                o usa tu correo institucional
              </p>

              <form onSubmit={handleLoginSubmit} noValidate className="space-y-2.5">
                <div>
                  <label
                    htmlFor={`mob-${loginEmailId}`}
                    className="block font-[family-name:var(--font-pixelify)] text-[11px] uppercase tracking-wider text-white/80 mb-0.5"
                  >
                    Correo electrónico
                  </label>
                  <div
                    className="rounded-xl px-3.5 py-2 bg-[#0f192e] border border-white/[0.04] transition-all focus-within:border-[#E9B949]/70 focus-within:ring-2 focus-within:ring-[#E9B949]/30"
                    style={{
                      boxShadow:
                        'inset 3px 3px 6px rgba(0,0,0,0.55), inset -2px -2px 5px rgba(255,255,255,0.035)',
                    }}
                  >
                    <input
                      id={`mob-${loginEmailId}`}
                      type="email"
                      value={loginState.email}
                      onChange={(e) =>
                        setLoginState((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="usuario@empresa.com"
                      autoComplete="email"
                      className="w-full bg-transparent text-xs text-white placeholder-white/30 focus:outline-none font-[family-name:var(--font-archivo)]"
                    />
                  </div>
                  {loginErrors.email && (
                    <p className="text-red-400 font-[family-name:var(--font-archivo)] text-[11px] mt-0.5">
                      {loginErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label
                      htmlFor={`mob-${loginPassId}`}
                      className="block font-[family-name:var(--font-pixelify)] text-[11px] uppercase tracking-wider text-white/80"
                    >
                      Contraseña
                    </label>
                    <a
                      href="#recuperar"
                      onClick={(e) => {
                        e.preventDefault();
                        alert('Redirigiendo a recuperación de contraseña...');
                      }}
                      className="font-[family-name:var(--font-pixelify)] text-[10px] text-[#E9B949]/80"
                    >
                      ¿Olvidaste?
                    </a>
                  </div>
                  <div
                    className="flex items-center rounded-xl px-3.5 py-2 bg-[#0f192e] border border-white/[0.04] transition-all focus-within:border-[#E9B949]/70 focus-within:ring-2 focus-within:ring-[#E9B949]/30"
                    style={{
                      boxShadow:
                        'inset 3px 3px 6px rgba(0,0,0,0.55), inset -2px -2px 5px rgba(255,255,255,0.035)',
                    }}
                  >
                    <input
                      id={`mob-${loginPassId}`}
                      type={showPassword ? 'text' : 'password'}
                      value={loginState.password}
                      onChange={(e) =>
                        setLoginState((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full bg-transparent text-xs text-white placeholder-white/30 focus:outline-none font-[family-name:var(--font-archivo)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="text-white/40 p-1 min-w-[28px] min-h-[28px] grid place-items-center"
                    >
                      {showPassword ? '👁' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-red-400 font-[family-name:var(--font-archivo)] text-[11px] mt-0.5">
                      {loginErrors.password}
                    </p>
                  )}
                </div>

                <div className="pt-1.5">
                  <button
                    type="submit"
                    className="w-full min-h-[44px] rounded-full py-2.5 px-5 font-[family-name:var(--font-pixelify)] font-bold text-xs uppercase tracking-wider bg-[#E9B949] text-[#14213D] active:scale-[0.98] transition-colors"
                  >
                    Ingresar al Sistema
                  </button>
                </div>
              </form>

              {/* Switch Móvil a Registro */}
              <div className="mt-5 pt-4 border-t border-white/[0.08] text-center">
                <p className="font-[family-name:var(--font-archivo)] text-[11px] text-white/60 mb-1.5">
                  ¿Aún no tienes una cuenta en WarEngine?
                </p>
                <button
                  type="button"
                  onClick={toggleMode}
                  className="min-h-[40px] px-5 py-1.5 rounded-full border border-[#E9B949]/50 text-[#E9B949] font-[family-name:var(--font-pixelify)] text-[11px] uppercase tracking-wider"
                >
                  Crear una cuenta nueva
                </button>
              </div>
            </div>
          ) : (
            /* Formulario Registro Móvil */
            <div className="w-full max-w-[320px] mx-auto">
              <h2 className="font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wider text-white text-center mb-2.5">
                Crear <span className="text-[#E9B949]">Cuenta</span>
              </h2>

              {/* Redes Sociales */}
              <div className="flex items-center justify-center gap-2.5 mb-3">
                <button
                  type="button"
                  aria-label="Registrarse con Google"
                  className="w-9 h-9 rounded-full grid place-items-center bg-[#14213D] text-white/80 active:scale-95"
                  style={{
                    boxShadow:
                      '3px 3px 8px rgba(0,0,0,0.7), -2px -2px 6px rgba(255,255,255,0.04)',
                  }}
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887C18.2 16.14 15.645 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.465 0 2.805.53 3.845 1.405l2.365-2.365C16.89 3.555 14.69 2.7 12.24 2.7 7.085 2.7 2.9 6.885 2.9 12.04c0 5.155 4.185 9.34 9.34 9.34 4.87 0 8.875-3.535 9.3-8.195H12.24z" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Registrarse con GitHub"
                  className="w-9 h-9 rounded-full grid place-items-center bg-[#14213D] text-white/80 active:scale-95"
                  style={{
                    boxShadow:
                      '3px 3px 8px rgba(0,0,0,0.7), -2px -2px 6px rgba(255,255,255,0.04)',
                  }}
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Registrarse con Microsoft"
                  className="w-9 h-9 rounded-full grid place-items-center bg-[#14213D] text-white/80 active:scale-95"
                  style={{
                    boxShadow:
                      '3px 3px 8px rgba(0,0,0,0.7), -2px -2px 6px rgba(255,255,255,0.04)',
                  }}
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M11.4 2.4H2.4v9h9v-9zm10.2 0h-9v9h9v-9zm-10.2 10.2H2.4v9h9v-9zm10.2 0h-9v9h9v-9z" />
                  </svg>
                </button>
              </div>

              <p className="font-[family-name:var(--font-pixelify)] text-[10px] text-center text-white/60 uppercase tracking-widest mb-3">
                o usa tu correo institucional
              </p>

              <form onSubmit={handleRegisterSubmit} noValidate className="space-y-2">
                <div>
                  <label
                    htmlFor={`mob-${regNombreId}`}
                    className="block font-[family-name:var(--font-pixelify)] text-[11px] uppercase tracking-wider text-white/80 mb-0.5"
                  >
                    Nombre Completo
                  </label>
                  <div
                    className="rounded-xl px-3.5 py-1.5 bg-[#0f192e] border border-white/[0.04] transition-all focus-within:border-[#E9B949]/70 focus-within:ring-2 focus-within:ring-[#E9B949]/30"
                    style={{
                      boxShadow:
                        'inset 3px 3px 6px rgba(0,0,0,0.55), inset -2px -2px 5px rgba(255,255,255,0.035)',
                    }}
                  >
                    <input
                      id={`mob-${regNombreId}`}
                      type="text"
                      value={registerState.nombre}
                      onChange={(e) =>
                        setRegisterState((prev) => ({ ...prev, nombre: e.target.value }))
                      }
                      placeholder="Santiago Granda"
                      autoComplete="name"
                      className="w-full bg-transparent text-xs text-white placeholder-white/30 focus:outline-none font-[family-name:var(--font-archivo)]"
                    />
                  </div>
                  {registerErrors.nombre && (
                    <p className="text-red-400 font-[family-name:var(--font-archivo)] text-[11px] mt-0.5">
                      {registerErrors.nombre}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={`mob-${regEmailId}`}
                    className="block font-[family-name:var(--font-pixelify)] text-[11px] uppercase tracking-wider text-white/80 mb-0.5"
                  >
                    Correo electrónico
                  </label>
                  <div
                    className="rounded-xl px-3.5 py-1.5 bg-[#0f192e] border border-white/[0.04] transition-all focus-within:border-[#E9B949]/70 focus-within:ring-2 focus-within:ring-[#E9B949]/30"
                    style={{
                      boxShadow:
                        'inset 3px 3px 6px rgba(0,0,0,0.55), inset -2px -2px 5px rgba(255,255,255,0.035)',
                    }}
                  >
                    <input
                      id={`mob-${regEmailId}`}
                      type="email"
                      value={registerState.email}
                      onChange={(e) =>
                        setRegisterState((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="usuario@empresa.com"
                      autoComplete="email"
                      className="w-full bg-transparent text-xs text-white placeholder-white/30 focus:outline-none font-[family-name:var(--font-archivo)]"
                    />
                  </div>
                  {registerErrors.email && (
                    <p className="text-red-400 font-[family-name:var(--font-archivo)] text-[11px] mt-0.5">
                      {registerErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={`mob-${regPassId}`}
                    className="block font-[family-name:var(--font-pixelify)] text-[11px] uppercase tracking-wider text-white/80 mb-0.5"
                  >
                    Contraseña
                  </label>
                  <div
                    className="flex items-center rounded-xl px-3.5 py-1.5 bg-[#0f192e] border border-white/[0.04] transition-all focus-within:border-[#E9B949]/70 focus-within:ring-2 focus-within:ring-[#E9B949]/30"
                    style={{
                      boxShadow:
                        'inset 3px 3px 6px rgba(0,0,0,0.55), inset -2px -2px 5px rgba(255,255,255,0.035)',
                    }}
                  >
                    <input
                      id={`mob-${regPassId}`}
                      type={showPassword ? 'text' : 'password'}
                      value={registerState.password}
                      onChange={(e) =>
                        setRegisterState((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full bg-transparent text-xs text-white placeholder-white/30 focus:outline-none font-[family-name:var(--font-archivo)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="text-white/40 p-1 min-w-[28px] min-h-[28px] grid place-items-center"
                    >
                      {showPassword ? '👁' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {registerErrors.password && (
                    <p className="text-red-400 font-[family-name:var(--font-archivo)] text-[11px] mt-0.5">
                      {registerErrors.password}
                    </p>
                  )}
                </div>

                <div className="pt-1.5">
                  <button
                    type="submit"
                    className="w-full min-h-[44px] rounded-full py-2.5 px-5 font-[family-name:var(--font-pixelify)] font-bold text-xs uppercase tracking-wider bg-[#E9B949] text-[#14213D] active:scale-[0.98] transition-colors"
                  >
                    Registrar Cuenta
                  </button>
                </div>
              </form>

              {/* Switch Móvil a Iniciar Sesión */}
              <div className="mt-5 pt-4 border-t border-white/[0.08] text-center">
                <p className="font-[family-name:var(--font-archivo)] text-[11px] text-white/60 mb-1.5">
                  ¿Ya tienes una cuenta activa en WarEngine?
                </p>
                <button
                  type="button"
                  onClick={toggleMode}
                  className="min-h-[40px] px-5 py-1.5 rounded-full border border-white/40 text-white font-[family-name:var(--font-pixelify)] text-[11px] uppercase tracking-wider"
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
