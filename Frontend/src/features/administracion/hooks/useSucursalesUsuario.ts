'use client';

/**
 * useSucursalesUsuario.ts — Asignación multisede de un usuario (RF-ADM-C10).
 *
 * GET  /usuarios/:id/sucursales → { principal, adicionales }
 * PUT  /usuarios/:id/sucursales ← asignarSucursalesSchema { sucursalPrincipalId, sucursalesAdicionalesIds }
 */

import { useCallback, useEffect, useState } from 'react';
import { asignarSucursalesSchema } from '@warengine/contracts';
import { useToast } from '@/components/ui/Toast';
import { erroresDesdeIssues, mensajeDeError, type ErroresCampo } from '@/lib/forms/validacion';
import { useRecurso } from '@/lib/hooks/useRecurso';
import { usuariosService } from '../api';
import type { UsuarioGestionado } from '../types';

const MENSAJES = {
  SUCURSAL_INACTIVA: 'No se puede asignar una sucursal inactiva.',
  SUCURSAL_NO_ENCONTRADA: 'Una de las sucursales elegidas no existe.',
};

export function useSucursalesUsuario(usuario: UsuarioGestionado | null, onHecho: () => void) {
  const toast = useToast();
  const actual = useRecurso(() => usuariosService.obtenerSucursales(usuario!.id), [usuario?.id], {
    habilitado: Boolean(usuario),
  });

  const [principal, setPrincipal] = useState<number | null>(null);
  const [adicionales, setAdicionales] = useState<number[]>([]);
  const [errores, setErrores] = useState<ErroresCampo>({});
  const [guardando, setGuardando] = useState(false);

  // Precarga la asignación vigente cuando llega del backend
  useEffect(() => {
    if (!actual.data) return;
    setPrincipal(actual.data.principal.id);
    setAdicionales(actual.data.adicionales.map((s) => s.id));
    setErrores({});
  }, [actual.data]);

  const cambiarPrincipal = useCallback((id: number) => {
    setPrincipal(id);
    // La principal no puede repetirse como adicional
    setAdicionales((prev) => prev.filter((x) => x !== id));
  }, []);

  const alternarAdicional = useCallback((id: number) => {
    setAdicionales((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const guardar = useCallback(async () => {
    if (!usuario) return;
    const parsed = asignarSucursalesSchema.safeParse({
      sucursalPrincipalId: principal ?? undefined,
      sucursalesAdicionalesIds: adicionales,
    });
    if (!parsed.success) {
      setErrores(erroresDesdeIssues(parsed.error.issues));
      return;
    }
    setGuardando(true);
    try {
      await usuariosService.asignarSucursales(usuario.id, parsed.data);
      toast.success(`Sedes de ${usuario.nombre} actualizadas. Su sesión se cerró para aplicar el cambio.`);
      onHecho();
    } catch (error) {
      toast.error(mensajeDeError(error, MENSAJES));
    } finally {
      setGuardando(false);
    }
  }, [usuario, principal, adicionales, toast, onHecho]);

  return {
    cargando: actual.loading,
    error: actual.error,
    principal,
    adicionales,
    errores,
    guardando,
    cambiarPrincipal,
    alternarAdicional,
    guardar,
  };
}
