'use client';

/**
 * RestablecerPasswordModal.tsx — El Super Admin define una contraseña temporal (RF-ADM-C9).
 */

import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/FormField';
import { Button3D } from '@/components/ui/Button3D';
import { Spinner } from '@/components/ui/Spinner';
import { useRestablecerPassword } from '../../hooks/useAccionesUsuario';
import type { UsuarioGestionado } from '../../types';

interface RestablecerPasswordModalProps {
  usuario: UsuarioGestionado | null;
  onClose: () => void;
  onHecho: () => void;
}

export function RestablecerPasswordModal({ usuario, onClose, onHecho }: RestablecerPasswordModalProps) {
  const { valores, errores, errorGeneral, enviando, setCampo, handleSubmit } = useRestablecerPassword(usuario, onHecho);
  const formId = 'form-restablecer-password';

  return (
    <Modal
      open={usuario !== null}
      onClose={onClose}
      locked={enviando}
      size="sm"
      title="Restablecer contraseña"
      description={usuario ? `${usuario.nombre} · ${usuario.email}` : undefined}
      footer={
        <>
          <Button3D size="panel" variant="navy" type="button" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button3D>
          <Button3D size="panel" variant="danger" type="submit" form={formId} disabled={enviando}>
            {enviando && <Spinner size={16} />}
            Restablecer
          </Button3D>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {errorGeneral && <p role="alert" className="text-sm text-red-300">{errorGeneral}</p>}
        <TextField
          label="Nueva contraseña temporal"
          required
          type="password"
          autoComplete="new-password"
          value={valores.nuevaPassword}
          onChange={(e) => setCampo('nuevaPassword', e.target.value)}
          error={errores.nuevaPassword}
          maxLength={128}
          hint="Entre 8 y 128 caracteres. Se cerrarán todas las sesiones del usuario."
        />
      </form>
    </Modal>
  );
}
