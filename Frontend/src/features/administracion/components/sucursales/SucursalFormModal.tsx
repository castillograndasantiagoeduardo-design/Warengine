'use client';

/**
 * SucursalFormModal.tsx — Modal para crear o editar una sucursal.
 */

import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/FormField';
import { Button3D } from '@/components/ui/Button3D';
import { Spinner } from '@/components/ui/Spinner';
import { useSucursalForm } from '../../hooks/useSucursalForm';
import type { Sucursal } from '../../types';

interface SucursalFormModalProps {
  open: boolean;
  sucursal: Sucursal | null;
  onClose: () => void;
  onGuardado: (sucursal: Sucursal, modo: 'crear' | 'editar') => void;
}

export function SucursalFormModal({ open, sucursal, onClose, onGuardado }: SucursalFormModalProps) {
  const { valores, errores, errorGeneral, enviando, setCampo, handleSubmit, modo } = useSucursalForm({
    sucursal,
    abierto: open,
    onGuardado,
  });
  const formId = 'form-sucursal';

  return (
    <Modal
      open={open}
      onClose={onClose}
      locked={enviando}
      title={modo === 'crear' ? 'Nueva sucursal' : 'Editar sucursal'}
      description={modo === 'crear' ? 'Da de alta una nueva sede operativa.' : `Modifica los datos de "${sucursal?.nombre}".`}
      footer={
        <>
          <Button3D size="panel" variant="navy" type="button" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button3D>
          <Button3D size="panel" type="submit" form={formId} disabled={enviando}>
            {enviando && <Spinner size={16} />}
            {modo === 'crear' ? 'Crear sucursal' : 'Guardar cambios'}
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
        <TextField
          label="Nombre"
          required
          placeholder="Ej. Sede Norte"
          value={valores.nombre}
          onChange={(e) => setCampo('nombre', e.target.value)}
          error={errores.nombre}
          maxLength={150}
          autoComplete="off"
        />
        <TextField
          label="Dirección"
          placeholder="Ej. Cra 15 # 93-20, Bogotá"
          value={valores.direccion}
          onChange={(e) => setCampo('direccion', e.target.value)}
          error={errores.direccion}
          maxLength={255}
        />
        <TextField
          label="Contacto"
          placeholder="Teléfono o correo de la sede"
          hint="Texto libre: teléfono, correo o ambos (máx. 100 caracteres)."
          value={valores.contacto}
          onChange={(e) => setCampo('contacto', e.target.value)}
          error={errores.contacto}
          maxLength={100}
        />
      </form>
    </Modal>
  );
}
