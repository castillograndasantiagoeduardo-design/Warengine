'use client';

/**
 * SucursalEstadoDialog.tsx — Confirmación para activar / inactivar una sucursal.
 */

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Sucursal } from '../../types';

interface SucursalEstadoDialogProps {
  sucursal: Sucursal | null;
  procesando: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SucursalEstadoDialog({ sucursal, procesando, onConfirm, onCancel }: SucursalEstadoDialogProps) {
  const activar = sucursal ? !sucursal.isActive : false;

  return (
    <ConfirmDialog
      open={sucursal !== null}
      title={activar ? 'Activar sucursal' : 'Inactivar sucursal'}
      tone={activar ? 'success' : 'danger'}
      confirmLabel={activar ? 'Activar' : 'Inactivar'}
      loading={procesando}
      onConfirm={onConfirm}
      onCancel={onCancel}
      message={
        activar ? (
          <p>
            <strong className="text-white">{sucursal?.nombre}</strong> volverá a estar disponible para asignar personal y operar.
          </p>
        ) : (
          <>
            <p>
              <strong className="text-white">{sucursal?.nombre}</strong> dejará de operar. Su historial de ventas e inventario se conserva.
            </p>
            <p className="mt-2 text-white/60">No es posible inactivar una sede que aún tiene usuarios activos asignados.</p>
          </>
        )
      }
    />
  );
}
