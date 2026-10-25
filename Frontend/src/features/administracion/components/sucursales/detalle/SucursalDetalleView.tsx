'use client';

/**
 * SucursalDetalleView.tsx — Ficha de una sucursal: datos, estadísticas, personal y ventas.
 */

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/panel/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button3D } from '@/components/ui/Button3D';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useSucursalDetalle } from '../../../hooks/useSucursalDetalle';
import { useCambiarEstadoSucursal } from '../../../hooks/useCambiarEstadoSucursal';
import { SEDE_PRINCIPAL_ID, type Sucursal } from '../../../types';
import { SucursalFormModal } from '../SucursalFormModal';
import { SucursalEstadoDialog } from '../SucursalEstadoDialog';
import { SucursalFicha } from './SucursalFicha';
import { SucursalUsuarios } from './SucursalUsuarios';
import { SucursalVentasRecientes } from './SucursalVentasRecientes';

const VOLVER = (
  <Link href="/dashboard/sucursales" className="inline-flex min-h-[44px] items-center text-white/60 hover:text-[#e9b949]">
    ← Sucursales
  </Link>
);

export function SucursalDetalleView({ id }: { id: number }) {
  const toast = useToast();
  const { data: detalle, loading, error, recargar, valido, sucursal, encargados } = useSucursalDetalle(id);
  const [editando, setEditando] = useState(false);
  const estado = useCambiarEstadoSucursal(useCallback(() => recargar(), [recargar]));

  const onGuardado = useCallback(
    (s: Sucursal) => {
      toast.success(`Cambios guardados en "${s.nombre}".`);
      setEditando(false);
      recargar();
    },
    [toast, recargar],
  );

  if (!valido || (error && !detalle)) {
    return (
      <div>
        <PageHeader title="Sucursal" back={VOLVER} />
        <div className="panel-card">
          <EmptyState
            icon="⚠"
            title={valido ? 'No se pudo cargar la sucursal' : 'Sucursal no válida'}
            description={error ?? 'El identificador de la sucursal no es válido.'}
            action={valido && <Button3D size="panel" variant="navy" type="button" onClick={recargar}>Reintentar</Button3D>}
          />
        </div>
      </div>
    );
  }

  if (loading && !detalle) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-32 w-full" lines={2} />
      </div>
    );
  }

  if (!detalle || !sucursal) return null;
  const bloqueoInactivar = sucursal.id === SEDE_PRINCIPAL_ID && sucursal.isActive;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={VOLVER}
        title={detalle.nombre}
        subtitle={sucursal.id === SEDE_PRINCIPAL_ID ? 'Sede principal del sistema' : `Sucursal #${detalle.id}`}
        actions={
          <>
            <Badge tone={detalle.isActive ? 'success' : 'neutral'} className="self-center">
              {detalle.isActive ? 'Activa' : 'Inactiva'}
            </Badge>
            <Button3D size="panel" variant="navy" type="button" onClick={() => setEditando(true)}>
              Editar
            </Button3D>
            <Button3D
              size="panel"
              variant={detalle.isActive ? 'danger' : 'success'}
              type="button"
              disabled={bloqueoInactivar}
              title={bloqueoInactivar ? 'La Sede Principal no puede inactivarse' : undefined}
              onClick={() => estado.solicitar(sucursal)}
            >
              {detalle.isActive ? 'Inactivar' : 'Activar'}
            </Button3D>
          </>
        }
      />

      <SucursalFicha detalle={detalle} encargados={encargados} />
      <SucursalUsuarios usuarios={detalle.usuariosAsignados} />
      <SucursalVentasRecientes ventas={detalle.ventasRecientes} />

      <SucursalFormModal open={editando} sucursal={sucursal} onClose={() => setEditando(false)} onGuardado={onGuardado} />
      <SucursalEstadoDialog sucursal={estado.objetivo} procesando={estado.procesando} onConfirm={estado.confirmar} onCancel={estado.cancelar} />
    </div>
  );
}
