'use client';

/**
 * useBranchStaff.ts — Hook para la gestión del personal de sede y monitoreo de turnos de caja.
 * 
 * Principios SOLID:
 * - Single Responsibility Principle (SRP): Gestión de estado de colaboradores y turnos POS.
 * - Dependency Inversion Principle (DIP): Se desacopla mediante IBranchStaffService.
 */

import { useState, useEffect, useCallback } from 'react';
import { branchStaffService } from '../api/branch-staff.service';
import type { IBranchStaffService } from '../api/branch-staff.interface';
import type {
  EmpleadoSede,
  EditarEmpleadoDTO,
  TurnoCajaActivo,
} from '../types/branch-staff.types';

interface UseBranchStaffOptions {
  sucursalId: number;
}

export function useBranchStaff(
  options: UseBranchStaffOptions,
  staffService: IBranchStaffService = branchStaffService,
) {
  const { sucursalId } = options;
  const [empleados, setEmpleados] = useState<EmpleadoSede[]>([]);
  const [turnoActivo, setTurnoActivo] = useState<TurnoCajaActivo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [filtroCargo, setFiltroCargo] = useState<string>('todos');

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [empsRes, turnoRes] = await Promise.allSettled([
        staffService.listarEmpleados(sucursalId),
        staffService.obtenerTurnoActual(),
      ]);

      if (empsRes.status === 'fulfilled') {
        setEmpleados(empsRes.value);
      } else {
        console.error('[useBranchStaff] Error cargando empleados:', empsRes.reason);
      }

      if (turnoRes.status === 'fulfilled') {
        setTurnoActivo(turnoRes.value);
      } else {
        setTurnoActivo(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al consultar colaboradores de la sede.');
    } finally {
      setIsLoading(false);
    }
  }, [sucursalId, staffService]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const editarEmpleado = async (
    id: string,
    data: EditarEmpleadoDTO,
  ): Promise<{ ok: boolean; error?: string }> => {
    setIsMutating(true);
    try {
      const actualizado = await staffService.editarEmpleado(id, data);
      setEmpleados((prev) => prev.map((e) => (e.id === id ? actualizado : e)));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'No fue posible actualizar los datos del empleado.' };
    } finally {
      setIsMutating(false);
    }
  };

  const cambiarEstado = async (id: string, isActive: boolean) => {
    // Optimistic update
    setEmpleados((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isActive } : e)),
    );
    try {
      await staffService.editarEmpleado(id, { isActive });
    } catch (err: any) {
      setError(err?.message || 'Error al cambiar el estado del colaborador.');
      await cargarDatos();
    }
  };

  const abrirTurno = async (fondoInicial: number): Promise<{ ok: boolean; error?: string }> => {
    setIsMutating(true);
    try {
      const nuevoTurno = await staffService.abrirTurno({ fondoInicial });
      setTurnoActivo(nuevoTurno);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Error al abrir el turno de caja.' };
    } finally {
      setIsMutating(false);
    }
  };

  const cerrarTurno = async (fondoFinal: number): Promise<{ ok: boolean; error?: string }> => {
    if (!turnoActivo) return { ok: false, error: 'No hay turno activo para cerrar.' };
    setIsMutating(true);
    try {
      await staffService.cerrarTurno(turnoActivo.id, { fondoFinal });
      setTurnoActivo(null);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Error al cerrar el turno de caja.' };
    } finally {
      setIsMutating(false);
    }
  };

  // Filtrado reactivo en memoria sobre datos verídicos
  const empleadosFiltrados = empleados.filter((emp) => {
    if (filtroEstado === 'activos' && !emp.isActive) return false;
    if (filtroEstado === 'inactivos' && emp.isActive) return false;
    if (filtroCargo !== 'todos' && emp.cargo !== filtroCargo) return false;

    if (busqueda.trim()) {
      const term = busqueda.toLowerCase().trim();
      const matchNombre = emp.nombre.toLowerCase().includes(term);
      const matchDoc = emp.numeroDocumento.toLowerCase().includes(term);
      const matchCargo = (emp.cargo || '').toLowerCase().includes(term);
      return matchNombre || matchDoc || matchCargo;
    }

    return true;
  });

  const cargosDisponibles = Array.from(
    new Set(empleados.map((e) => e.cargo).filter(Boolean) as string[]),
  );

  return {
    empleados: empleadosFiltrados,
    totalEmpleados: empleados.length,
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
    recargar: cargarDatos,
    editarEmpleado,
    cambiarEstado,
    abrirTurno,
    cerrarTurno,
  };
}
