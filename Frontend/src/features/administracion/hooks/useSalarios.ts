'use client';

/**
 * useSalarios.ts — Historial salarial y registro de aumentos de un empleado (RF-ADM-C14).
 *
 * POST /administracion/empleados/:id/salarios valida con registrarAumentoSalarioSchema
 * (sueldo > 0 con máx. 2 decimales, fechaEfectiva YYYY-MM-DD, motivo opcional).
 */

import { useCallback, useEffect } from 'react';
import { registrarAumentoSalarioSchema } from '@warengine/contracts';
import { useToast } from '@/components/ui/Toast';
import { aFechaISO } from '@/lib/format/fecha';
import { formatCOP } from '@/lib/format/moneda';
import { useFormulario, vacioAUndefined } from '@/lib/hooks/useFormulario';
import { useRecurso } from '@/lib/hooks/useRecurso';
import { empleadosService } from '../api';
import type { Empleado, RegistrarAumentoSalarioInput } from '../types';

export interface AumentoFormValues {
  sueldo: string;
  fechaEfectiva: string;
  motivo: string;
}

const inicial = (): AumentoFormValues => ({ sueldo: '', fechaEfectiva: aFechaISO(), motivo: '' });

const aPayload = (v: AumentoFormValues) => ({
  // El input es type="number": llega con punto decimal. Vacío → undefined ("El sueldo es obligatorio.")
  sueldo: v.sueldo.trim() === '' ? undefined : Number(v.sueldo),
  fechaEfectiva: vacioAUndefined(v.fechaEfectiva),
  motivo: vacioAUndefined(v.motivo) ?? null,
});

export function useSalarios(empleado: Empleado | null, onAumentoRegistrado: (sueldo: number) => void) {
  const toast = useToast();
  const historial = useRecurso(
    () => empleadosService.historialSalarios(empleado!.id),
    [empleado?.id],
    { habilitado: Boolean(empleado) },
  );
  const { recargar } = historial;

  const onSubmit = useCallback(
    async (data: RegistrarAumentoSalarioInput) => {
      if (!empleado) return;
      await empleadosService.registrarAumento(empleado.id, data);
      toast.success(`Nuevo sueldo de ${empleado.nombre}: ${formatCOP(data.sueldo)}.`);
      recargar();
      onAumentoRegistrado(data.sueldo);
    },
    [empleado, toast, recargar, onAumentoRegistrado],
  );

  const form = useFormulario<AumentoFormValues, RegistrarAumentoSalarioInput>({
    esquema: registrarAumentoSalarioSchema,
    valoresIniciales: inicial(),
    aPayload,
    onSubmit,
  });

  const { reset } = form;
  useEffect(() => {
    if (empleado) reset(inicial());
  }, [empleado, reset]);

  const enviar = useCallback(
    async (e?: React.FormEvent) => {
      if (await form.handleSubmit(e)) reset(inicial());
    },
    [form, reset],
  );

  // El backend devuelve el historial; se muestra del más reciente al más antiguo
  const registros = [...(historial.data ?? [])].sort((a, b) => b.fechaEfectiva.localeCompare(a.fechaEfectiva));

  return { registros, cargando: historial.loading, error: historial.error, denegado: historial.denegado, recargar, form, enviar };
}
