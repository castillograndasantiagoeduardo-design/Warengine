'use client';

/**
 * DashboardSkeleton.tsx — Estado de carga con pulsos visuales de vidrio para el Dashboard.
 *
 * Principio SOLID: Single Responsibility Principle (SRP).
 * Reproduce la grilla exacta del dashboard con paneles translúcidos animados (animate-pulse)
 * evitando saltos de layout (Cumulative Layout Shift - CLS) durante la carga de datos.
 */

import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse select-none">
      {/* 1. Título y Contexto */}
      <div className="flex flex-col gap-2">
        <div className="h-7 w-64 rounded-lg bg-white/[0.06]" />
        <div className="h-4 w-96 rounded-lg bg-white/[0.03]" />
      </div>

      {/* 2. Cuadrícula de 4 Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-[#111d3f]/50 border border-white/[0.05] p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-white/[0.06]" />
              <div className="h-8 w-8 rounded-lg bg-white/[0.04]" />
            </div>
            <div className="h-7 w-36 rounded bg-white/[0.08]" />
            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
              <div className="h-4 w-14 rounded-full bg-white/[0.05]" />
              <div className="h-3 w-28 rounded bg-white/[0.03]" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Fila Intermedia: Gráfica de Ventas (65%) y Salud de Inventario (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Gráfico */}
        <div className="lg:col-span-8 h-80 rounded-2xl bg-[#111d3f]/50 border border-white/[0.05] p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="space-y-1.5">
              <div className="h-5 w-44 rounded bg-white/[0.06]" />
              <div className="h-3 w-32 rounded bg-white/[0.03]" />
            </div>
            <div className="h-4 w-24 rounded bg-white/[0.04]" />
          </div>
          <div className="h-40 w-full rounded-xl bg-white/[0.02]" />
          <div className="h-8 w-full rounded-lg bg-white/[0.04]" />
        </div>

        {/* Salud del Inventario */}
        <div className="lg:col-span-4 h-80 rounded-2xl bg-[#111d3f]/50 border border-white/[0.05] p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-5 w-36 rounded bg-white/[0.06]" />
            <div className="h-7 w-7 rounded-lg bg-white/[0.04]" />
          </div>
          <div className="space-y-2">
            <div className="h-7 w-20 rounded bg-white/[0.08]" />
            <div className="h-2 w-full rounded-full bg-white/[0.04]" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((k) => (
              <div key={k} className="h-10 w-full rounded-xl bg-white/[0.02]" />
            ))}
          </div>
          <div className="h-4 w-32 rounded bg-white/[0.04]" />
        </div>
      </div>

      {/* 4. Fila Inferior: Operaciones Recientes (65%) y Turnos en Curso (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Operaciones Recientes */}
        <div className="lg:col-span-8 h-64 rounded-2xl bg-[#111d3f]/50 border border-white/[0.05] p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-5 w-40 rounded bg-white/[0.06]" />
            <div className="h-4 w-16 rounded bg-white/[0.04]" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-8 w-full rounded-lg bg-white/[0.02]" />
            ))}
          </div>
        </div>

        {/* Turnos en Curso */}
        <div className="lg:col-span-4 h-64 rounded-2xl bg-[#111d3f]/50 border border-white/[0.05] p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-5 w-32 rounded bg-white/[0.06]" />
            <div className="h-5 w-20 rounded-full bg-white/[0.04]" />
          </div>
          <div className="space-y-2.5">
            {[1, 2, 3].map((m) => (
              <div key={m} className="h-10 w-full rounded-xl bg-white/[0.02]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
