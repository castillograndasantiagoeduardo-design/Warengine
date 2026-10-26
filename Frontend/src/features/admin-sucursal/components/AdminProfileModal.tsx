'use client';

/**
 * AdminProfileModal.tsx — Ficha y gestión de perfil del Administrador de Sucursal.
 * 
 * Principios SOLID y Seguridad (RBAC):
 * - Single Responsibility Principle (SRP): Permite al administrador consultar su
 *   identidad corporativa y actualizar sus propios datos de contacto (teléfono y dirección).
 * - Segregación de Funciones: Protege la integridad del sistema impidiendo la auto-desactivación,
 *   la modificación de sueldos o el cambio arbitrario de rol/sucursal (reservado para Superadmin).
 */

import React, { useState, useEffect } from 'react';
import { Button3D } from '@/components/ui/Button3D';
import { GlassCard } from './GlassCard';
import { ShieldIcon, UsersRoundIcon } from './Icons';
import type { EmpleadoSede } from '../types/branch-staff.types';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  perfil: EmpleadoSede | null;
  email?: string;
  rolNombre?: string;
  onGuardarContacto: (data: { telefono?: string; direccion?: string }) => Promise<{ ok: boolean; error?: string }>;
}

export function AdminProfileModal({
  isOpen,
  onClose,
  perfil,
  email = 'admin.norte@warengine.local',
  rolNombre = 'admin-sucursal',
  onGuardarContacto,
}: AdminProfileModalProps) {
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (perfil) {
      setTelefono(perfil.telefono || '');
      setDireccion(perfil.direccion || '');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [perfil, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await onGuardarContacto({
        telefono: telefono.trim(),
        direccion: direccion.trim(),
      });

      if (!res.ok) {
        setErrorMsg(res.error || 'No fue posible actualizar tus datos de contacto.');
        return;
      }

      setSuccessMsg('Datos de contacto actualizados correctamente.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al guardar los cambios.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inicial = perfil?.nombre ? perfil.nombre.charAt(0).toUpperCase() : 'A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050b18]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0d1630] border border-[#e3b341]/30 shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden">
        
        {/* 1. Cabecera con Avatar de Identidad y Rol */}
        <div className="relative px-6 py-5 bg-gradient-to-b from-[#18264d] to-[#0d1630] border-b border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#b88a1f] to-[#e3b341] text-[#0d1630] font-black text-xl font-[family-name:var(--font-ui)] shadow-lg shadow-amber-500/20">
                {inicial}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white uppercase font-[family-name:var(--font-anton)] tracking-wider">
                    {perfil?.nombre || 'Mi Perfil Administrativo'}
                  </h2>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 rounded-full bg-[#e3b341]/15 text-[#e3b341] border border-[#e3b341]/30 text-[10px] font-bold uppercase tracking-wider font-[family-name:var(--font-ui)]">
                    {rolNombre}
                  </span>
                  <span className="text-[11px] text-slate-400 font-[family-name:var(--font-archivo)]">
                    {perfil?.sucursalNombre || 'Sede Principal'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 w-8 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors flex items-center justify-center cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 2. Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {/* Bloque A: Datos Institucionales Inmutables (Segregación RBAC) */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-[family-name:var(--font-ui)] tracking-wider">
                Credenciales del Sistema
              </span>
              <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                <ShieldIcon size={11} />
                Gestionado por Superadmin
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Documento</span>
                <span className="font-semibold text-white font-mono">
                  {perfil?.tipoDocumento} {perfil?.numeroDocumento}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Correo Corporativo</span>
                <span className="font-semibold text-white truncate block">
                  {email}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Cargo Laboral</span>
                <span className="font-semibold text-slate-200">
                  {perfil?.cargo || 'Administrador de Sucursal'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Fecha de Ingreso</span>
                <span className="font-semibold text-slate-200 font-mono">
                  {perfil?.fechaIngreso || '2026-10-25'}
                </span>
              </div>
            </div>
          </div>

          {/* Bloque B: Datos de Contacto Personal Editables */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-[family-name:var(--font-archivo)]">
              Información de Contacto Personal
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 font-[family-name:var(--font-archivo)]">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej. +57 310 123 4567"
                className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#e3b341]/60 focus:ring-1 focus:ring-[#e3b341]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 font-[family-name:var(--font-archivo)]">
                Dirección de Residencia
              </label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Ej. Carrera 15 # 93-40, Apto 502"
                className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#e3b341]/60 focus:ring-1 focus:ring-[#e3b341]/40"
              />
            </div>
          </div>

          {/* Aviso de Seguridad Informativo */}
          <p className="text-[11px] text-slate-400 leading-relaxed">
            * Para solicitar cambios de sede asignada, variación salarial o reasignación de credenciales, contacta a la mesa directiva a través del Super Administrador.
          </p>

          {/* 3. Acciones de Cierre y Guardado */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-white/20 text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-xs font-semibold cursor-pointer"
            >
              Cerrar
            </button>
            <Button3D
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="font-bold font-[family-name:var(--font-ui)] tracking-wide uppercase text-xs"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Contacto'}
            </Button3D>
          </div>
        </form>
      </div>
    </div>
  );
}
