'use client';

/**
 * useEmpleadoForm.ts — Edición de datos de un empleado (RF-ADM-C12) con editarEmpleadoSchema.
 *
 * Campos vacíos se envían como null para poder borrarlos (el esquema los acepta nullable).
 * Las áreas disponibles son las de la sucursal del empleado.
 */

import { useCallback, useEffect } from 'react';
import { editarEmpleadoSchema, PERMISSIONS } from '@warengine/contracts';
import { usePermissions } from '@/features/autenticacion';
import { useFormulario } from '@/lib/hooks/useFormulario';
import { useRecurso } from '@/lib/hooks/useRecurso';
import { areasService, empleadosService } from '../api';
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

const aPayload = (v: EmpleadoFormValues) => ({
  nombre: v.nombre,
  telefono: vacioANull(v.telefono),
  direccion: vacioANull(v.direccion),
  cargo: vacioANull(v.cargo),
  areaId: v.areaId ? Number(v.areaId) : null,
  isActive: v.isActive,
});

interface Opciones {
  empleado: Empleado | null;
  onGuardado: (e: Empleado) => void;
}

export function useEmpleadoForm({ empleado, onGuardado }: Opciones) {
  const { tienePermiso } = usePermissions();
  const puedeVerAreas = tienePermiso(PERMISSIONS.ADMIN_GESTIONAR_SUCURSALES);

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

  return { ...form, areas: areas.data ?? [], cargandoAreas: areas.loading };
}
