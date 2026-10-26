'use client';

/**
 * BranchStaffView.tsx — Vista de gestión de personal de sede y supervisión de turnos POS.
 * 
 * Principios SOLID:
 * - Single Responsibility Principle (SRP): Orquestación del directorio de colaboradores
 *   y telemetría de turnos de caja en vivo (RF-ADM-C5, RF-ADM-C12, RF-FMC-B2, RF-FMC-A10).
 * - Dependency Inversion Principle (DIP): Se alimenta del hook useBranchStaff.
 */

import React, { useState } from 'react';
import { useBranchStaff } from '../hooks/useBranchStaff';
import { GlassCard } from './GlassCard';
import { Button3D } from '@/components/ui/Button3D';
import { EditEmployeeModal } from './EditEmployeeModal';
import { AdminProfileModal } from './AdminProfileModal';
import { CloseShiftModal } from './CloseShiftModal';
import {
  UsersRoundIcon,
  SearchIcon,
  RefreshCwIcon,
  EditIcon,
  DollarSignIcon,
  ShieldIcon,
} from './Icons';
import type { EmpleadoSede } from '../types/branch-staff.types';

interface BranchStaffViewProps {
  sucursalId: number;
  sucursalNombre?: string;
  className?: string;
}

export function BranchStaffView({
  sucursalId,
  sucursalNombre,
  className = '',
}: BranchStaffViewProps) {
  const {
    empleados,
    totalEmpleados,
    turnoActivo,
    cargosDisponibles,
    isLoading,
    isMutating,
    error,
    busqueda,
    setBusqueda,
    filtroEstado,
    setFiltroEstado,
    filtroCargo,
    setFiltroCargo,
    recargar,
    editarEmpleado,
    cambiarEstado,
    cerrarTurno,
    perfilAdmin,
    editarPerfilAdmin,
  } = useBranchStaff({ sucursalId });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<EmpleadoSede | null>(null);
  const [isAdminProfileModalOpen, setIsAdminProfileModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);

  const handleAbrirEdicion = (emp: EmpleadoSede) => {
    setEmpleadoSeleccionado(emp);
    setIsEditModalOpen(true);
  };

  const totalActivos = empleados.filter((e) => e.isActive).length;
  const totalInactivos = empleados.filter((e) => !e.isActive).length;

  return (
    <div className={`space-y-5 animate-in fade-in duration-300 ${className}`}>
      {/* 1. Encabezado de la Sección */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/[0.04]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-[family-name:var(--font-anton)] tracking-wider text-white uppercase">
              Personal & Turnos de Sede
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-[#e3b341]/10 text-[#e3b341] border border-[#e3b341]/25 font-[family-name:var(--font-pixelify)]">
              {sucursalNombre}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-[family-name:var(--font-archivo)] mt-0.5">
            Directorio de colaboradores y supervisión operativa de cajas registradoras.
          </p>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => recargar()}
            title="Refrescar datos"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <RefreshCwIcon size={15} className={isLoading ? 'animate-spin text-[#e3b341]' : ''} />
          </button>

          {turnoActivo && (
            <button
              onClick={() => setIsCloseShiftModalOpen(true)}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-colors cursor-pointer text-xs font-semibold font-[family-name:var(--font-archivo)]"
            >
              <DollarSignIcon size={14} />
              <span>Cerrar Turno de Caja</span>
            </button>
          )}

          <Button3D
            size="sm"
            onClick={() => setIsAdminProfileModalOpen(true)}
            className="font-bold font-[family-name:var(--font-pixelify)] tracking-wide uppercase text-xs h-9"
          >
            <ShieldIcon size={14} className="mr-1" />
            <span>Mi Perfil Admin</span>
          </Button3D>
        </div>
      </div>

      {/* 2. Banner de Error */}
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

      {/* 3. Panel Superior: Telemetría de Cajas y Estado Operativo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Tarjeta de Turno de Caja Activo */}
        <div className="lg:col-span-7">
          <GlassCard padding="lg" className="h-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                  <DollarSignIcon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-[family-name:var(--font-anton)] tracking-wider">
                    Telemetría de Caja (POS)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Control de apertura, base de efectivo y ventas de turno en vivo (RF-FMC-B2).
                  </p>
                </div>
              </div>

              {turnoActivo ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] text-[11px] font-semibold font-mono">
                  <span className="h-2 w-2 rounded-full bg-[#10b981] animate-ping" />
                  Turno Abierto
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-slate-700/40 border border-slate-600/40 text-slate-400 text-[11px] font-semibold font-mono">
                  Sin Turno Activo
                </span>
              )}
            </div>

            {turnoActivo ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Cajero</span>
                    <span className="text-xs font-bold text-white truncate block mt-0.5">
                      {turnoActivo.usuarioNombre || 'Cajero en Turno'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Fondo Base</span>
                    <span className="text-xs font-bold font-mono text-[#e3b341] block mt-0.5">
                      {formatCOP(turnoActivo.fondoInicial)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Ventas Hoy</span>
                    <span className="text-xs font-bold font-mono text-[#10b981] block mt-0.5">
                      {formatCOP(turnoActivo.totalVentas || 0)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Transacciones</span>
                    <span className="text-xs font-bold font-mono text-white block mt-0.5">
                      {turnoActivo.cantidadVentas || 0} recibos
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Apertura registrada:{' '}
                    {turnoActivo.fechaApertura
                      ? new Date(turnoActivo.fechaApertura).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'En curso'}
                  </span>
                  <button
                    onClick={() => setIsCloseShiftModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cerrar y Cuadrar Caja
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-slate-400">
                  <DollarSignIcon size={22} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                    Cajas en reposo · Sin turnos de venta activos
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Los cajeros abren e inician su turno directamente desde su estación de mostrador en el Punto de Venta (POS).
                  </p>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Tarjeta de Resumen de Personal */}
        <div className="lg:col-span-5">
          <GlassCard padding="lg" className="h-full space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.06]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e3b341]/15 text-[#e3b341] border border-[#e3b341]/30">
                <UsersRoundIcon size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-[family-name:var(--font-anton)] tracking-wider">
                  Personal de la Sede
                </h3>
                <p className="text-[11px] text-slate-400">
                  Colaboradores adscritos a {sucursalNombre}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Total</span>
                <span className="text-lg font-bold font-mono text-white block mt-0.5">
                  {totalEmpleados}
                </span>
                <span className="text-[10px] text-slate-500">Colaboradores</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Activos</span>
                <span className="text-lg font-bold font-mono text-[#10b981] block mt-0.5">
                  {totalActivos}
                </span>
                <span className="text-[10px] text-slate-500">En nómina</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Puestos</span>
                <span className="text-lg font-bold font-mono text-[#e3b341] block mt-0.5">
                  {cargosDisponibles.length}
                </span>
                <span className="text-[10px] text-slate-500">Cargos</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-slate-400 leading-relaxed">
              💡 Toda modificación en las fichas de los colaboradores queda registrada en el módulo de auditoría de seguridad del sistema.
            </div>
          </GlassCard>
        </div>
      </div>

      {/* 4. Barra de Búsqueda y Filtros de Personal */}
      <GlassCard padding="md" className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Buscador */}
          <div className="md:col-span-6 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <SearchIcon size={15} />
            </span>
            <input
              type="text"
              placeholder="Buscar colaborador por nombre, documento o cargo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-[#e3b341]/60 text-xs font-[family-name:var(--font-archivo)]"
            />
          </div>

          {/* Filtro por Cargo */}
          <div className="md:col-span-3">
            <select
              value={filtroCargo}
              onChange={(e) => setFiltroCargo(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#e3b341]"
            >
              <option value="todos">Todos los cargos ({totalEmpleados})</option>
              {cargosDisponibles.map((cargo) => (
                <option key={cargo} value={cargo}>
                  {cargo}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Estado */}
          <div className="md:col-span-3 flex items-center gap-1.5">
            <button
              onClick={() => setFiltroEstado('todos')}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center ${
                filtroEstado === 'todos'
                  ? 'bg-[#e3b341]/20 text-[#e3b341] border border-[#e3b341]/40'
                  : 'bg-white/[0.02] text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              Todos ({totalEmpleados})
            </button>
            <button
              onClick={() => setFiltroEstado('activos')}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center ${
                filtroEstado === 'activos'
                  ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                  : 'bg-white/[0.02] text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              Activos ({totalActivos})
            </button>
            <button
              onClick={() => setFiltroEstado('inactivos')}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center ${
                filtroEstado === 'inactivos'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-white/[0.02] text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              Inactivos ({totalInactivos})
            </button>
          </div>
        </div>
      </GlassCard>

      {/* 5. Directorio / Tabla de Colaboradores de Sede */}
      <GlassCard padding="none" className="overflow-hidden">
        {isLoading && empleados.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="inline-block animate-spin text-[#e3b341]">
              <RefreshCwIcon size={24} />
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Cargando personal adscrito a la sede...
            </p>
          </div>
        ) : empleados.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-400">
              <UsersRoundIcon size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-[family-name:var(--font-anton)] uppercase tracking-wide">
                No hay colaboradores en esta vista
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed font-[family-name:var(--font-archivo)]">
                {busqueda || filtroCargo !== 'todos' || filtroEstado !== 'todos'
                  ? 'Ningún empleado coincide con los criterios de búsqueda aplicados.'
                  : 'No hay personal registrado en esta sede. Los usuarios son asignados desde la administración corporativa.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-[family-name:var(--font-pixelify)]">
                  <th className="py-3 px-4">Documento</th>
                  <th className="py-3 px-4">Colaborador</th>
                  <th className="py-3 px-4">Cargo / Función</th>
                  <th className="py-3 px-4">Contacto</th>
                  <th className="py-3 px-4 text-center">Ingreso</th>
                  <th className="py-3 px-4 text-center w-28">Estado</th>
                  <th className="py-3 px-4 text-center w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {empleados.map((emp) => {
                  const partes = emp.nombre.split(' ').filter(Boolean);
                  const iniciales = partes.length >= 2 ? `${partes[0][0]}${partes[1][0]}` : emp.nombre.slice(0, 2);

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-white/[0.02] transition-colors font-[family-name:var(--font-archivo)]"
                    >
                      {/* Documento */}
                      <td className="py-3 px-4 font-mono text-slate-400">
                        <span className="text-[11px]">
                          {emp.tipoDocumento} {emp.numeroDocumento}
                        </span>
                      </td>

                      {/* Colaborador con Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-[#e3b341]/10 border border-[#e3b341]/20 flex items-center justify-center text-[#e3b341] font-bold font-mono text-xs">
                            {iniciales.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-xs">
                              {emp.nombre}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              {emp.areaNombre || 'Área General'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cargo */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 font-medium text-[11px]">
                          {emp.cargo || 'Sin cargo asignado'}
                        </span>
                      </td>

                      {/* Contacto */}
                      <td className="py-3 px-4 text-slate-300">
                        {emp.telefono ? (
                          <span className="font-mono text-xs block">{emp.telefono}</span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Sin teléfono</span>
                        )}
                        {emp.direccion && (
                          <span className="text-[10px] text-slate-400 truncate block max-w-xs">
                            {emp.direccion}
                          </span>
                        )}
                      </td>

                      {/* Fecha de Ingreso */}
                      <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                        {emp.fechaIngreso || '—'}
                      </td>

                      {/* Estado con Toggle */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => cambiarEstado(emp.id, !emp.isActive)}
                            title={emp.isActive ? 'Desactivar colaborador' : 'Activar colaborador'}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              emp.isActive ? 'bg-[#10b981]' : 'bg-slate-700'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                emp.isActive ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span
                            className={`text-[10px] font-semibold font-mono ${
                              emp.isActive ? 'text-[#10b981]' : 'text-slate-500'
                            }`}
                          >
                            {emp.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleAbrirEdicion(emp)}
                          title="Editar ficha del colaborador"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#e3b341] hover:bg-[#e3b341]/10 transition-colors cursor-pointer"
                        >
                          <EditIcon size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* 6. Modales Funcionales */}
      <EditEmployeeModal
        isOpen={isEditModalOpen}
        empleado={empleadoSeleccionado}
        onClose={() => {
          setIsEditModalOpen(false);
          setEmpleadoSeleccionado(null);
        }}
        onGuardar={editarEmpleado}
      />

      <AdminProfileModal
        isOpen={isAdminProfileModalOpen}
        perfil={perfilAdmin}
        onClose={() => setIsAdminProfileModalOpen(false)}
        onGuardarContacto={editarPerfilAdmin}
      />

      <CloseShiftModal
        isOpen={isCloseShiftModalOpen}
        turno={turnoActivo}
        onClose={() => setIsCloseShiftModalOpen(false)}
        onCerrar={cerrarTurno}
      />
    </div>
  );
}
