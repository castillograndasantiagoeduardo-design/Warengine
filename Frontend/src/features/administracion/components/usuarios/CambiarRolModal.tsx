'use client';

/**
 * CambiarRolModal.tsx — Reasignación de rol con protección del último Super Admin (RF-ADM-C7).
 */

import type { RolResumenDto } from '@warengine/contracts';
import { Modal } from '@/components/ui/Modal';
import { SelectField } from '@/components/ui/FormField';
import { Button3D } from '@/components/ui/Button3D';
import { Spinner } from '@/components/ui/Spinner';
import { etiquetaRol } from '@/lib/format/rol';
import { useCambiarRol } from '../../hooks/useAccionesUsuario';
import type { UsuarioGestionado } from '../../types';

interface CambiarRolModalProps {
  usuario: UsuarioGestionado | null;
  roles: RolResumenDto[];
  onClose: () => void;
  onHecho: () => void;
}

export function CambiarRolModal({ usuario, roles, onClose, onHecho }: CambiarRolModalProps) {
  const { valores, errores, errorGeneral, enviando, setCampo, handleSubmit } = useCambiarRol(usuario, onHecho);
  const formId = 'form-cambiar-rol';
  const sinCambios = usuario !== null && valores.rolId === String(usuario.rolId);

  return (
    <Modal
      open={usuario !== null}
      onClose={onClose}
      locked={enviando}
      size="sm"
      title="Cambiar rol"
      description={usuario ? `${usuario.nombre} · ${usuario.email}` : undefined}
      footer={
        <>
          <Button3D size="panel" variant="navy" type="button" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button3D>
          <Button3D size="panel" type="submit" form={formId} disabled={enviando || sinCambios}>
            {enviando && <Spinner size={16} />}
            Guardar rol
          </Button3D>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {errorGeneral && (
          <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {errorGeneral}
          </p>
        )}
        <SelectField
          label="Nuevo rol"
          required
          value={valores.rolId}
          onChange={(e) => setCampo('rolId', e.target.value)}
          error={errores.rolId}
          options={roles.map((r) => ({ value: r.id, label: etiquetaRol(r.nombre) }))}
          hint={roles.find((r) => String(r.id) === valores.rolId)?.descripcion ?? undefined}
        />
        <p className="text-xs text-white/55">Al cambiar el rol se cierran las sesiones activas del usuario para aplicar los nuevos permisos.</p>
      </form>
    </Modal>
  );
}
