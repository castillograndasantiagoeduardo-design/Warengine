/**
 * auditoria.etiquetas.ts — Etiquetas legibles del catálogo de auditoría (@warengine/contracts).
 */

import { ACCIONES_AUDITORIA_VALORES, ENTIDADES_AUDITORIA_VALORES } from '@warengine/contracts';
import type { BadgeTone } from '@/components/ui/Badge';

export const ETIQUETA_ACCION: Record<string, string> = {
  crear: 'Creación',
  editar: 'Edición',
  activar: 'Activación',
  inactivar: 'Inactivación',
  cambiar_rol: 'Cambio de rol',
  acceso_denegado: 'Acceso denegado',
  solicitar_recuperacion_password: 'Solicitud de recuperación',
  restablecer_password: 'Restablecer contraseña',
  eliminar: 'Eliminación',
  anular: 'Anulación',
};

export const TONO_ACCION: Record<string, BadgeTone> = {
  crear: 'success',
  editar: 'info',
  activar: 'success',
  inactivar: 'warning',
  cambiar_rol: 'gold',
  acceso_denegado: 'danger',
  restablecer_password: 'warning',
  eliminar: 'danger',
  anular: 'danger',
};

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replaceAll('_', ' ');

export const OPCIONES_ACCION = ACCIONES_AUDITORIA_VALORES.map((a) => ({ value: a, label: ETIQUETA_ACCION[a] ?? capitalizar(a) }));
export const OPCIONES_ENTIDAD = ENTIDADES_AUDITORIA_VALORES.map((e) => ({ value: e, label: capitalizar(e) }));

export const etiquetaAccion = (a: string) => ETIQUETA_ACCION[a] ?? capitalizar(a);
export const etiquetaEntidad = (e: string) => capitalizar(e);
