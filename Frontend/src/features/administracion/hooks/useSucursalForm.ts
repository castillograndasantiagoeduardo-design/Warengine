'use client';

/**
 * useSucursalForm.ts — Crear o editar una sucursal (RF-ADM-C2, C3).
 *
 * Valida con crearSucursalSchema / editarSucursalSchema de @warengine/contracts.
 * Campos reales de la entidad: nombre, direccion y contacto (no hay teléfono ni encargado).
 */

import { useCallback, useEffect, useMemo } from 'react';
import { crearSucursalSchema, editarSucursalSchema } from '@warengine/contracts';
import { useFormulario, vacioAUndefined } from '@/lib/hooks/useFormulario';
import { sucursalesService } from '../api';
import type { CrearSucursalInput, EditarSucursalInput, Sucursal } from '../types';

export interface SucursalFormValues {
  nombre: string;
  direccion: string;
  contacto: string;
}

const VACIO: SucursalFormValues = { nombre: '', direccion: '', contacto: '' };

const MENSAJES = {
  SUCURSAL_DUPLICADA: 'Ya existe una sucursal con ese nombre.',
};

function valoresDe(sucursal: Sucursal | null): SucursalFormValues {
  if (!sucursal) return VACIO;
  return { nombre: sucursal.nombre, direccion: sucursal.direccion ?? '', contacto: sucursal.contacto ?? '' };
}

const aPayload = (v: SucursalFormValues) => ({
  nombre: v.nombre,
  direccion: vacioAUndefined(v.direccion),
  contacto: vacioAUndefined(v.contacto),
});

interface Opciones {
  /** null = crear; una sucursal = editar. */
  sucursal: Sucursal | null;
  abierto: boolean;
  onGuardado: (sucursal: Sucursal, modo: 'crear' | 'editar') => void;
}

export function useSucursalForm({ sucursal, abierto, onGuardado }: Opciones) {
  const modo = sucursal ? 'editar' : 'crear';

  const onSubmit = useCallback(
    async (data: EditarSucursalInput) => {
      const guardada = sucursal
        ? await sucursalesService.editar(sucursal.id, data)
        : await sucursalesService.crear(data as CrearSucursalInput);
      onGuardado(guardada, modo);
    },
    [sucursal, modo, onGuardado],
  );

  // Crear exige nombre; editar acepta cambios parciales. Ambos producen un EditarSucursalInput válido.
  const esquema = useMemo(() => (sucursal ? editarSucursalSchema : crearSucursalSchema), [sucursal]);

  const form = useFormulario<SucursalFormValues, EditarSucursalInput>({
    esquema,
    valoresIniciales: valoresDe(sucursal),
    aPayload,
    onSubmit,
    mensajesPorCodigo: MENSAJES,
  });

  // Al abrir el modal se cargan los datos de la sucursal (o se limpia para crear)
  const { reset } = form;
  useEffect(() => {
    if (abierto) reset(valoresDe(sucursal));
  }, [abierto, sucursal, reset]);

  return { ...form, modo };
}
