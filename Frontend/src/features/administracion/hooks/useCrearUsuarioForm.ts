'use client';

/**
 * useCrearUsuarioForm.ts — Alta atómica de empleado + cuenta (RF-ADM-C6) con crearUsuarioSchema.
 */

import { useCallback, useEffect } from 'react';
import { crearUsuarioSchema, type CrearUsuarioInput } from '@warengine/contracts';
import { useFormulario, vacioAUndefined } from '@/lib/hooks/useFormulario';
import { usuariosService } from '../api';
import type { UsuarioGestionado } from '../types';

export interface CrearUsuarioValues {
  nombre: string;
  tipoDocumento: 'CC' | 'CE';
  numeroDocumento: string;
  email: string;
  password: string;
  rolId: string;
  sucursalId: string;
  cargo: string;
}

const VACIO: CrearUsuarioValues = {
  nombre: '',
  tipoDocumento: 'CC',
  numeroDocumento: '',
  email: '',
  password: '',
  rolId: '',
  sucursalId: '',
  cargo: '',
};

const MENSAJES = {
  EMAIL_YA_REGISTRADO: 'Ya existe un usuario con ese correo.',
  DOCUMENTO_YA_REGISTRADO: 'Ya existe un empleado con ese documento.',
  SUCURSAL_INACTIVA: 'La sucursal elegida está inactiva.',
  ROL_NO_ENCONTRADO: 'El rol elegido no existe.',
};

const aPayload = (v: CrearUsuarioValues) => ({
  nombre: v.nombre,
  tipoDocumento: v.tipoDocumento,
  numeroDocumento: v.numeroDocumento,
  email: v.email,
  password: v.password,
  rolId: v.rolId ? Number(v.rolId) : undefined,
  sucursalId: v.sucursalId ? Number(v.sucursalId) : undefined,
  cargo: vacioAUndefined(v.cargo),
});

export function useCrearUsuarioForm(abierto: boolean, onCreado: (u: UsuarioGestionado) => void) {
  const onSubmit = useCallback(
    async (data: CrearUsuarioInput) => {
      onCreado(await usuariosService.crear(data));
    },
    [onCreado],
  );

  const form = useFormulario<CrearUsuarioValues, CrearUsuarioInput>({
    esquema: crearUsuarioSchema,
    valoresIniciales: VACIO,
    aPayload,
    onSubmit,
    mensajesPorCodigo: MENSAJES,
  });

  // Formulario limpio cada vez que se abre: nunca se conserva una contraseña escrita
  const { reset } = form;
  useEffect(() => {
    if (abierto) reset(VACIO);
  }, [abierto, reset]);

  return form;
}
