'use client';

/**
 * useEmpleadoForm.ts — Edición de datos de un empleado (RF-ADM-C12) con editarEmpleadoSchema.
 *
 * Campos vacíos se envían como null para poder borrarlos (el esquema los acepta nullable).
 * Las áreas disponibles son las de la sucursal del empleado.
 */

import { useCallback, useEffect, useMemo } from 'react';
import { editarEmpleadoSchema } from '@warengine/contracts';
import { usePermissions } from '@/features/autenticacion';
import { useFormulario } from '@/lib/hooks/useFormulario';
import { useRecurso } from '@/lib/hooks/useRecurso';
import { areasService, empleadosService } from '../api';
import { PERMISOS_ADMIN } from '../permisos';
import type { EditarEmpleadoInput, Empleado } from '../types';

export interface EmpleadoFormValues {
  nombre: string;
  telefono: string;
  direccion: string;
  cargo: string;
  areaId: string;
  isActive: boolean;
}

function valoresDe(e: Empleado | null): EmpleadoFormValues {
  return {
    nombre: e?.nombre ?? '',
    telefono: e?.telefono ?? '',
    direccion: e?.direccion ?? '',
    cargo: e?.cargo ?? '',
    areaId: e?.areaId ? String(e.areaId) : '',
    isActive: e?.isActive ?? true,
  };
}

const vacioANull = (v: string) => (v.trim() === '' ? null : v.trim());

/** Sin permiso para listar áreas el campo es de solo lectura: no se envía para no borrarla. */
const crearPayload = (incluirArea: boolean) => (v: EmpleadoFormValues) => ({
  nombre: v.nombre,
  telefono: vacioANull(v.telefono),
  direccion: vacioANull(v.direccion),
  cargo: vacioANull(v.cargo),
  ...(incluirArea ? { areaId: v.areaId ? Number(v.areaId) : null } : {}),
  isActive: v.isActive,
});

interface Opciones {
  empleado: Empleado | null;
  onGuardado: (e: Empleado) => void;
}

export function useEmpleadoForm({ empleado, onGuardado }: Opciones) {
  const { tienePermiso } = usePermissions();
  const puedeVerAreas = tienePermiso(PERMISOS_ADMIN.gestionarSucursales);
  const aPayload = useMemo(() => crearPayload(puedeVerAreas), [puedeVerAreas]);

  const onSubmit = useCallback(
    async (data: EditarEmpleadoInput) => {
      if (!empleado) return;
      onGuardado(await empleadosService.editar(empleado.id, data));
    },
    [empleado, onGuardado],
  );

  const form = useFormulario<EmpleadoFormValues, EditarEmpleadoInput>({
    esquema: editarEmpleadoSchema,
    valoresIniciales: valoresDe(empleado),
    aPayload,
    onSubmit,
  });

  const { reset } = form;
  useEffect(() => {
    if (empleado) reset(valoresDe(empleado));
  }, [empleado, reset]);

  const areas = useRecurso(
    () => areasService.listarPorSucursal(empleado!.sucursalId),
    [empleado?.sucursalId],
    { habilitado: Boolean(empleado) && puedeVerAreas },
  );

  return { ...form, areas: areas.data ?? [], cargandoAreas: areas.loading, puedeVerAreas };
}
