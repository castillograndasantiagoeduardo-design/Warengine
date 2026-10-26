'use client';

/**
 * BranchSuppliersView.tsx — Vista dedicada de gestión CRUD de proveedores de sede.
 * 
 * Principios SOLID:
 * - Single Responsibility (SRP): Responsable exclusivo de la consulta, búsqueda y edición
 *   de proveedores comerciales (RF-ADM-B6).
 * - Dependency Inversion (DIP): Orquesta el estado mediante useBranchSuppliers.
 */

import React, { useState } from 'react';
import { useBranchSuppliers } from '../hooks/useBranchSuppliers';
import { GlassCard } from './GlassCard';
import { Button3D } from '@/components/ui/Button3D';
import { CreateSupplierModal } from './CreateSupplierModal';
import { EditSupplierModal } from './EditSupplierModal';
import {
  SearchIcon,
  PlusIcon,
  RefreshCwIcon,
  TruckIcon,
  EditIcon,
} from './Icons';
import type { ProveedorInventario } from '../types/branch-inventory.types';

interface BranchSuppliersViewProps {
  className?: string;
}

export function BranchSuppliersView({ className = '' }: BranchSuppliersViewProps) {
  const {
    proveedores,
    isLoading,
    error,
    busqueda,
    setBusqueda,
    filtroEstado,
    setFiltroEstado,
    recargar,
    crearProveedor,
    editarProveedor,
    cambiarEstado,
  } = useBranchSuppliers();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<ProveedorInventario | null>(null);

  const handleAbrirEdicion = (p: ProveedorInventario) => {
    setProveedorSeleccionado(p);
    setIsEditOpen(true);
  };

  const totalActivos = proveedores.filter((p) => p.isActive).length;
  const totalInactivos = proveedores.filter((p) => !p.isActive).length;

  return (
    <div className={`space-y-5 animate-in fade-in duration-300 ${className}`}>
      {/* 1. Encabezado de la Sección con Acciones Principales */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/[0.04]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-[family-name:var(--font-anton)] tracking-wider text-white uppercase">
              Directorio de Proveedores
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-[#e3b341]/10 text-[#e3b341] border border-[#e3b341]/25 font-[family-name:var(--font-pixelify)]">
              Abastecimiento
            </span>
          </div>
          <p className="text-xs text-slate-400 font-[family-name:var(--font-archivo)] mt-0.5">
            Registro, edición y control de contacto de distribuidores comerciales de mercancía.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => recargar()}
            title="Refrescar proveedores"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <RefreshCwIcon size={15} className={isLoading ? 'animate-spin text-[#e3b341]' : ''} />
          </button>

          <Button3D
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="font-bold font-[family-name:var(--font-pixelify)] tracking-wide uppercase text-xs h-9"
          >
            <PlusIcon size={14} className="mr-1" />
            <span>Nuevo Proveedor</span>
          </Button3D>
        </div>
      </div>

      {/* 2. Barra de Búsqueda y Filtros de Estado */}
      <GlassCard padding="md" className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Buscador */}
          <div className="md:col-span-8 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <SearchIcon size={15} />
            </span>
            <input
              type="text"
              placeholder="Buscar proveedor por nombre comercial o datos de contacto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-[#e3b341]/60 text-xs font-[family-name:var(--font-archivo)]"
            />
          </div>

          {/* Chips de Estado */}
          <div className="md:col-span-4 flex items-center gap-2">
            <button
              onClick={() => setFiltroEstado('todos')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer text-center ${
                filtroEstado === 'todos'
                  ? 'bg-[#e3b341]/20 text-[#e3b341] border border-[#e3b341]/40 font-semibold'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              Todos ({proveedores.length})
            </button>
            <button
              onClick={() => setFiltroEstado('activos')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer text-center ${
                filtroEstado === 'activos'
                  ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 font-semibold'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              Activos ({totalActivos})
            </button>
            <button
              onClick={() => setFiltroEstado('inactivos')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer text-center ${
                filtroEstado === 'inactivos'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 font-semibold'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              Inactivos ({totalInactivos})
            </button>
          </div>
        </div>
      </GlassCard>

      {/* 3. Banner de Error */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => recargar()}
            className="text-xs underline text-red-200 hover:text-white font-semibold cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* 4. Tabla de Proveedores */}
      <GlassCard padding="none" className="overflow-hidden">
        {isLoading && proveedores.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="inline-block animate-spin text-[#e3b341]">
              <RefreshCwIcon size={24} />
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Cargando directorio de proveedores...
            </p>
          </div>
        ) : proveedores.length === 0 ? (
          /* Estado Vacío Verídico */
          <div className="p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-400">
              <TruckIcon size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-[family-name:var(--font-anton)] uppercase tracking-wide">
                No hay proveedores registrados
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed font-[family-name:var(--font-archivo)]">
                {busqueda
                  ? 'No se encontraron proveedores que coincidan con la búsqueda.'
                  : 'Aún no se han dado de alta proveedores en la plataforma. Registra el primero para asociarlo a compras y catálogo.'}
              </p>
            </div>
            <div className="pt-2">
              <Button3D
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="font-bold uppercase text-xs"
              >
                + Registrar Primer Proveedor
              </Button3D>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-[family-name:var(--font-pixelify)]">
                  <th className="py-3 px-4 w-16">ID</th>
                  <th className="py-3 px-4">Empresa / Razón Social</th>
                  <th className="py-3 px-4">Datos de Contacto</th>
                  <th className="py-3 px-4 text-center w-28">Estado</th>
                  <th className="py-3 px-4 text-center w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {proveedores.map((prov) => (
                  <tr
                    key={prov.id}
                    className="hover:bg-white/[0.02] transition-colors font-[family-name:var(--font-archivo)]"
                  >
                    {/* ID */}
                    <td className="py-3 px-4 font-mono text-slate-500">
                      #{prov.id}
                    </td>

                    {/* Nombre */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-[#e3b341]/10 border border-[#e3b341]/20 flex items-center justify-center text-[#e3b341]">
                          <TruckIcon size={16} />
                        </div>
                        <div>
                          <p className="font-semibold text-white text-xs">
                            {prov.nombre}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            Distribuidor Comercial
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contacto */}
                    <td className="py-3 px-4 text-slate-300">
                      {prov.contacto ? (
                        <span className="font-mono text-xs">{prov.contacto}</span>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">
                          Sin información de contacto
                        </span>
                      )}
                    </td>

                    {/* Estado con Toggle */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => cambiarEstado(prov.id, !prov.isActive)}
                          title={prov.isActive ? 'Desactivar proveedor' : 'Activar proveedor'}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            prov.isActive ? 'bg-[#10b981]' : 'bg-slate-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              prov.isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-[10px] font-semibold font-mono ${
                            prov.isActive ? 'text-[#10b981]' : 'text-slate-500'
                          }`}
                        >
                          {prov.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleAbrirEdicion(prov)}
                        title="Editar proveedor"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#e3b341] hover:bg-[#e3b341]/10 transition-colors cursor-pointer"
                      >
                        <EditIcon size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* 5. Modales Funcionales */}
      <CreateSupplierModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onProveedorCreado={() => recargar()}
        crearProveedorFn={crearProveedor}
      />

      <EditSupplierModal
        isOpen={isEditOpen}
        proveedor={proveedorSeleccionado}
        onClose={() => {
          setIsEditOpen(false);
          setProveedorSeleccionado(null);
        }}
        onGuardar={editarProveedor}
      />
    </div>
  );
}
