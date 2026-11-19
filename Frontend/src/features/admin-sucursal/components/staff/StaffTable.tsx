'use client';

import React from 'react';
import type { EmpleadoSede } from '../../types/branch-staff.types';

interface StaffTableProps {
  empleados: EmpleadoSede[];
  onVerFicha: (empleado: EmpleadoSede) => void;
}

function obtenerIniciales(nombre: string): string {
  if (!nombre) return '??';
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

export function StaffTable({ empleados, onVerFicha }: StaffTableProps) {
  return (
    <>
      {/* Vista de escritorio (tabla con separadores finos) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm text-white/80">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-white/50 border-b border-white/10">
            <tr>
              <th scope="col" className="px-5 py-3.5 font-medium">Colaborador</th>
              <th scope="col" className="px-4 py-3.5 font-medium">Cargo / Puesto</th>
              <th scope="col" className="px-4 py-3.5 font-medium">Área</th>
              <th scope="col" className="px-4 py-3.5 font-medium">Contacto</th>
              <th scope="col" className="px-4 py-3.5 font-medium">Estado</th>
              <th scope="col" className="px-5 py-3.5 text-right font-medium">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-transparent">
            {empleados.map((emp) => (
              <tr
                key={emp.id}
                className="hover:bg-white/[0.02] transition-colors group"
              >
                {/* Colaborador */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-300 font-semibold flex items-center justify-center text-xs tracking-wider shrink-0">
                      {obtenerIniciales(emp.nombre)}
                    </div>
                    <div>
                      <div className="font-medium text-white group-hover:text-brand-300 transition-colors">
                        {emp.nombre}
                      </div>
                      <div className="text-xs text-white/50 font-mono">
                        {emp.tipoDocumento} {emp.numeroDocumento}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Cargo */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-white/90">{emp.cargo || 'Sin cargo asignado'}</span>
                </td>

                {/* Área */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/5 text-white/70 border border-white/10">
                    {emp.areaNombre || 'General'}
                  </span>
                </td>

                {/* Contacto */}
                <td className="px-4 py-4 whitespace-nowrap text-xs text-white/70">
                  {emp.telefono ? (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {emp.telefono}
                    </div>
                  ) : (
                    <span className="text-white/30 italic">Sin teléfono</span>
                  )}
                </td>

                {/* Estado */}
                <td className="px-4 py-4 whitespace-nowrap">
                  {emp.isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                      Inactivo
                    </span>
                  )}
                </td>

                {/* Acción */}
                <td className="px-5 py-4 whitespace-nowrap text-right">
                  <button
                    type="button"
                    onClick={() => onVerFicha(emp)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-brand-300 hover:text-white bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Ver ficha</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista móvil (tarjetas apiladas) */}
      <div className="md:hidden space-y-3">
        {empleados.map((emp) => (
          <div
            key={emp.id}
            className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-300 font-semibold flex items-center justify-center text-xs tracking-wider shrink-0">
                  {obtenerIniciales(emp.nombre)}
                </div>
                <div>
                  <h4 className="font-medium text-white text-sm">{emp.nombre}</h4>
                  <p className="text-xs text-white/50 font-mono">
                    {emp.tipoDocumento} {emp.numeroDocumento}
                  </p>
                </div>
              </div>
              <div>
                {emp.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                    Inactivo
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/5">
              <div>
                <span className="text-white/40 block">Cargo:</span>
                <span className="text-white/90 font-medium">{emp.cargo || '—'}</span>
              </div>
              <div>
                <span className="text-white/40 block">Área:</span>
                <span className="text-white/90 font-medium">{emp.areaNombre || 'General'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => onVerFicha(emp)}
                className="w-full py-2 rounded-lg text-xs font-medium text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 transition-colors text-center"
              >
                Ver ficha completa
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
