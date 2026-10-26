'use client';

/**
 * useAccionesUsuario.ts — Cambiar rol, restablecer contraseña y activar/desactivar una cuenta.
 *
 * Reglas del backend reflejadas en la UI:
 * - ULTIMO_SUPER_ADMIN: no se puede quitar el rol ni desactivar al único Super Admin activo.
 * - Cambiar rol, estado o contraseña invalida las sesiones del usuario afectado.
 */

import { useCallback, useEffect, useState } from 'react';
import { cambiarRolSchema, restablecerPasswordSchema } from '@warengine/contracts';
import { useToast } from '@/components/ui/Toast';
import { mensajeDeError } from '@/lib/forms/validacion';
import { useFormulario } from '@/lib/hooks/useFormulario';
import { usuariosService } from '../api';
import type { UsuarioGestionado } from '../types';

const ULTIMO_SUPER_ADMIN = 'No puedes quitar el rol ni desactivar al único Super Admin activo. Asigna antes otro Super Admin.';

/** Modal "Cambiar rol" (PUT /usuarios/:id/rol). */
export function useCambiarRol(usuario: UsuarioGestionado | null, onHecho: () => void) {
  const toast = useToast();
  const form = useFormulario<{ rolId: string }, { rolId: number }>({
    esquema: cambiarRolSchema,
    valoresIniciales: { rolId: '' },
    aPayload: (v) => ({ rolId: v.rolId ? Number(v.rolId) : undefined }),
    mensajesPorCodigo: { ULTIMO_SUPER_ADMIN, ROL_NO_ENCONTRADO: 'El rol elegido no existe.' },
    onSubmit: async ({ rolId }) => {
      if (!usuario) return;
      const actualizado = await usuariosService.cambiarRol(usuario.id, rolId);
      toast.success(`${actualizado.nombre} ahora es ${actualizado.rolNombre}. Su sesión se cerró para aplicar el cambio.`);
      onHecho();
    },
  });

  const { reset } = form;
  useEffect(() => {
    if (usuario) reset({ rolId: String(usuario.rolId) });
  }, [usuario, reset]);

  return form;
}

/** Modal "Restablecer contraseña" (PUT /usuarios/:id/password). */
export function useRestablecerPassword(usuario: UsuarioGestionado | null, onHecho: () => void) {
  const toast = useToast();
  const form = useFormulario<{ nuevaPassword: string }, { nuevaPassword: string }>({
    esquema: restablecerPasswordSchema,
    valoresIniciales: { nuevaPassword: '' },
    onSubmit: async ({ nuevaPassword }) => {
      if (!usuario) return;
      await usuariosService.restablecerPassword(usuario.id, nuevaPassword);
      toast.success(`Contraseña de ${usuario.nombre} restablecida. Comunícala por un canal seguro.`);
      onHecho();
    },
  });

  // Nunca se conserva la contraseña escrita entre aperturas
  const { reset } = form;
  useEffect(() => {
    if (usuario) reset({ nuevaPassword: '' });
  }, [usuario, reset]);

  return form;
}

/** Confirmación "Activar / Desactivar" (PUT /usuarios/:id/estado). */
export function useCambiarEstadoUsuario(onHecho: () => void) {
  const toast = useToast();
  const [objetivo, setObjetivo] = useState<UsuarioGestionado | null>(null);
  const [procesando, setProcesando] = useState(false);

  const confirmar = useCallback(async () => {
    if (!objetivo) return;
    const activar = !objetivo.isActive;
    setProcesando(true);
    try {
      await usuariosService.cambiarEstado(objetivo.id, activar);
      toast.success(`Cuenta de ${objetivo.nombre} ${activar ? 'activada' : 'desactivada'}.`);
      setObjetivo(null);
      onHecho();
    } catch (error) {
      toast.error(mensajeDeError(error, { ULTIMO_SUPER_ADMIN }));
    } finally {
      setProcesando(false);
    }
  }, [objetivo, onHecho, toast]);

  return { objetivo, procesando, solicitar: setObjetivo, cancelar: () => setObjetivo(null), confirmar };
}
