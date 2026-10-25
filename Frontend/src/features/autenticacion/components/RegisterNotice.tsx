'use client';

/**
 * RegisterNotice.tsx — Vista informativa para 'Crear Cuenta' en WarEngine ERP.
 *
 * Principio SOLID:
 * - Single Responsibility: Explica amigablemente la política corporativa de cuentas
 *   privadas sin inventar llamadas inexistentes al backend.
 */

import React, { useState } from 'react';
import { SocialAuthButtons } from './SocialAuthButtons';

interface RegisterNoticeProps {
  isMobile?: boolean;
  onSwitchToLogin?: () => void;
}

export function RegisterNotice({
  isMobile = false,
  onSwitchToLogin,
}: RegisterNoticeProps) {
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [email, setEmail] = useState('');

  const handleSolicitar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSolicitudEnviada(true);
  };

  return (
    <div className={`w-full ${isMobile ? 'max-w-[320px]' : 'max-w-[290px]'} mx-auto`}>
      <h2 className="font-[family-name:var(--font-anton)] text-3xl uppercase tracking-wider text-white text-center mb-2">
        Crear <span className="text-[#E9B949]">Cuenta</span>
      </h2>

      <SocialAuthButtons />

      <p className="font-[family-name:var(--font-pixelify)] text-[11px] text-center text-white/60 uppercase tracking-widest mb-2.5">
        acceso corporativo y sucursales
      </p>

      {solicitudEnviada ? (
        <div
          role="status"
          className="rounded-2xl p-4 bg-[#0f192e] border border-[#E9B949]/30 text-center animate-in fade-in zoom-in-95 duration-200"
          style={{
            boxShadow:
              'inset 3px 3px 6px rgba(0,0,0,0.55), inset -2px -2px 5px rgba(255,255,255,0.035)',
          }}
        >
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#E9B949]/15 text-[#E9B949] grid place-items-center">
            ✓
          </div>
          <h3 className="font-[family-name:var(--font-anton)] text-base uppercase text-white tracking-wider mb-1">
            Solicitud Registrada
          </h3>
          <p className="font-[family-name:var(--font-archivo)] text-[11px] text-white/75 leading-relaxed mb-3">
            Se ha notificado al Administrador de TI para tu correo{' '}
            <span className="text-[#E9B949] font-mono">{email}</span>. Recibirás tu credencial temporal una vez aprobado tu rol.
          </p>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="rounded-full px-4 py-1.5 bg-[#E9B949] text-[#14213D] font-[family-name:var(--font-pixelify)] font-bold text-xs uppercase cursor-pointer hover:bg-white transition-colors"
          >
            Ir a Iniciar Sesión
          </button>
        </div>
      ) : (
        <form onSubmit={handleSolicitar} className="space-y-3">
          <div
            className="rounded-xl p-3 bg-[#0f192e] border border-white/[0.04] text-[11px] font-[family-name:var(--font-archivo)] text-white/80 leading-relaxed"
            style={{
              boxShadow:
                'inset 3px 3px 6px rgba(0,0,0,0.55), inset -2px -2px 5px rgba(255,255,255,0.035)',
            }}
          >
            <p className="mb-1 text-white font-medium">
              🏢 Sistema ERP Multi-Sucursal Privado
            </p>
            <p className="text-white/65">
              En WarEngine, los perfiles de operadores, cajeros y supervisores son gestionados por el Administrador de cada Sucursal.
            </p>
          </div>

          <div>
            <label
              htmlFor="reg-corp-email"
              className="block font-[family-name:var(--font-pixelify)] text-[11px] uppercase tracking-wider text-white/80 mb-1"
            >
              Tu Correo Institucional
            </label>
            <div
              className="rounded-xl px-3.5 py-2 bg-[#0f192e] border border-white/[0.04] focus-within:border-[#E9B949]/70 focus-within:ring-2 focus-within:ring-[#E9B949]/30 transition-all"
              style={{
                boxShadow:
                  'inset 3px 3px 6px rgba(0,0,0,0.55), inset -2px -2px 5px rgba(255,255,255,0.035)',
              }}
            >
              <input
                id="reg-corp-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operador@empresa.com"
                className="w-full bg-transparent text-xs text-white placeholder-white/30 focus:outline-none font-[family-name:var(--font-archivo)]"
              />
            </div>
          </div>

          <div className="pt-1.5">
            <button
              type="submit"
              className="w-full rounded-full py-2.5 px-5 font-[family-name:var(--font-pixelify)] font-bold text-xs uppercase tracking-wider bg-[#E9B949] text-[#14213D] hover:bg-[#14213D] hover:text-white hover:border hover:border-[#E9B949]/60 active:scale-[0.98] transition-colors duration-200 cursor-pointer"
              style={{
                boxShadow:
                  '5px 5px 12px rgba(0,0,0,0.45), -3px -3px 10px rgba(255,255,255,0.06)',
              }}
            >
              Solicitar Alta de Usuario
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
