'use client';

import React, { useEffect, useRef } from 'react';
import type { EmpleadoSede } from '../../types/branch-staff.types';

interface StaffDrawerProps {
  empleado: EmpleadoSede | null;
  onClose: () => void;
}

export function StaffDrawer({ empleado, onClose }: StaffDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (empleado) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [empleado, onClose]);

  if (!empleado) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div
          ref={drawerRef}
          className="w-screen max-w-md pointer-events-auto vidrio border-l border-white/10 flex flex-col shadow-2xl"
        >
          {/* Header del drawer */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-brand-400">
                Ficha Laboral
              </span>
              <h3 id="drawer-title" className="text-lg font-semibold text-white mt-0.5">
                {empleado.nombre}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar panel lateral"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenido con scroll */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Estado e Identificación */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <div>
                <span className="text-xs text-white/40 block">Documento de Identidad</span>
                <span className="text-sm font-mono font-medium text-white">
                  {empleado.tipoDocumento} {empleado.numeroDocumento}
                </span>
              </div>
              <div>
                {empleado.isActive ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                    Inactivo
                  </span>
                )}
              </div>
            </div>

            {/* Datos organizacionales */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Posición Organizacional
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-xs text-white/40 block">Cargo oficial</span>
                  <span className="text-sm font-medium text-white/90">
                    {empleado.cargo || 'Sin cargo asignado'}
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-xs text-white/40 block">Área / Departamento</span>
                  <span className="text-sm font-medium text-white/90">
                    {empleado.areaNombre || 'General'}
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-xs text-white/40 block">Sucursal adscrita</span>
                  <span className="text-sm font-medium text-white/90">
                    {empleado.sucursalNombre || 'Sede actual'}
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-xs text-white/40 block">Fecha de ingreso</span>
                  <span className="text-sm font-medium text-white/90 font-mono">
                    {empleado.fechaIngreso
                      ? new Date(empleado.fechaIngreso).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'No registrada'}
                  </span>
                </div>
              </div>
            </div>

            {/* Datos de contacto */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Información de Contacto
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-xs text-white/40 block">Teléfono / Celular</span>
                  <span className="text-sm font-medium text-white/90 font-mono">
                    {empleado.telefono || 'Sin teléfono registrado'}
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-xs text-white/40 block">Dirección de residencia</span>
                  <span className="text-sm font-medium text-white/90">
                    {empleado.direccion || 'Sin dirección registrada'}
                  </span>
                </div>
              </div>
            </div>

            {/* Aviso informativo de alcance */}
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs leading-relaxed flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <strong className="font-semibold block text-amber-200">Gestión de Personal de Sede</strong>
                Como administrador de sucursal puedes consultar la ficha del personal asignado a tu sede. El alta, cambio salarial o desvinculación formal se realiza desde el nivel corporativo.
              </div>
            </div>
          </div>

          {/* Footer del drawer */}
          <div className="p-5 border-t border-white/10 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              Cerrar ficha
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
