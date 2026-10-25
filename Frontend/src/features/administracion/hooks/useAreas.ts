'use client';

/**
 * useAreas.ts — Áreas organizativas de una sucursal (RF-ADM-C13): listar, crear, editar y eliminar.
 */

import { useCallback, useEffect, useState } from 'react';
import { crearAreaSchema } from '@warengine/contracts';
import { useRecurso } from '@/lib/hooks/useRecurso';
import { useFormulario } from '@/lib/hooks/useFormulario';
import { mensajeDeError } from '@/lib/forms/validacion';
import { useToast } from '@/components/ui/Toast';
import { areasService } from '../api';
import type { Area, CrearAreaInput } from '../types';

const MENSAJES = {
  AREA_DUPLICADA: 'Ya existe un área con ese nombre en esta sucursal.',
};

export function useAreas(sucursalId: number) {
  const toast = useToast();
  const lista = useRecurso(() => areasService.listarPorSucursal(sucursalId), [sucursalId]);
  const { recargar } = lista;

  // Formulario (crear / editar comparten esquema: solo `nombre`)
  const [formAbierto, setFormAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState<Area | null>(null);

  const onSubmit = useCallback(
    async (data: CrearAreaInput) => {
      if (enEdicion) {
        await areasService.editar(enEdicion.id, data);
        toast.success(`Área renombrada a "${data.nombre}".`);
      } else {
        await areasService.crear(sucursalId, data);
        toast.success(`Área "${data.nombre}" creada.`);
      }
      setFormAbierto(false);
      recargar();
    },
    [enEdicion, sucursalId, toast, recargar],
  );

  const form = useFormulario<CrearAreaInput, CrearAreaInput>({
    esquema: crearAreaSchema,
    valoresIniciales: { nombre: '' },
    onSubmit,
    mensajesPorCodigo: MENSAJES,
  });

  const { reset } = form;
  useEffect(() => {
    if (formAbierto) reset({ nombre: enEdicion?.nombre ?? '' });
  }, [formAbierto, enEdicion, reset]);

  const abrirCrear = useCallback(() => {
    setEnEdicion(null);
    setFormAbierto(true);
  }, []);

  const abrirEditar = useCallback((area: Area) => {
    setEnEdicion(area);
    setFormAbierto(true);
  }, []);

  // Eliminación con confirmación
  const [aEliminar, setAEliminar] = useState<Area | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const confirmarEliminar = useCallback(async () => {
    if (!aEliminar) return;
    setEliminando(true);
    try {
      await areasService.eliminar(aEliminar.id);
      toast.success(`Área "${aEliminar.nombre}" eliminada.`);
      setAEliminar(null);
      recargar();
    } catch (error) {
      toast.error(mensajeDeError(error));
    } finally {
      setEliminando(false);
    }
  }, [aEliminar, toast, recargar]);

  return {
    areas: lista.data ?? [],
    loading: lista.loading,
    error: lista.error,
    recargar,
    form,
    formAbierto,
    enEdicion,
    abrirCrear,
    abrirEditar,
    cerrarForm: () => setFormAbierto(false),
    aEliminar,
    eliminando,
    solicitarEliminar: setAEliminar,
    cancelarEliminar: () => setAEliminar(null),
    confirmarEliminar,
  };
}
