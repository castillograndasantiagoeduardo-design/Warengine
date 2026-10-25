'use client';

/**
 * EmpleadoFormModal.tsx — Edición de la ficha del empleado (independiente de su cuenta de usuario).
 */

import { Modal } from '@/components/ui/Modal';
import { SelectField, TextField } from '@/components/ui/FormField';
import { Button3D } from '@/components/ui/Button3D';
import { Spinner } from '@/components/ui/Spinner';
import { useEmpleadoForm } from '../../hooks/useEmpleadoForm';
import type { Empleado } from '../../types';

interface EmpleadoFormModalProps {
  empleado: Empleado | null;
  onClose: () => void;
  onGuardado: (e: Empleado) => void;
}

export function EmpleadoFormModal({ empleado, onClose, onGuardado }: EmpleadoFormModalProps) {
  const { valores, errores, errorGeneral, enviando, setCampo, handleSubmit, areas, cargandoAreas } = useEmpleadoForm({
    empleado,
    onGuardado,
  });
  const formId = 'form-empleado';

  return (
    <Modal
      open={empleado !== null}
      onClose={onClose}
      locked={enviando}
      title="Editar empleado"
      description={empleado ? `${empleado.tipoDocumento} ${empleado.numeroDocumento} · ${empleado.sucursalNombre}` : undefined}
      footer={
        <>
          <Button3D size="panel" variant="navy" type="button" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button3D>
          <Button3D size="panel" type="submit" form={formId} disabled={enviando}>
            {enviando && <Spinner size={16} />}
            Guardar cambios
          </Button3D>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {errorGeneral && (
          <p role="alert" className="sm:col-span-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {errorGeneral}
          </p>
        )}
        <TextField
          className="sm:col-span-2"
          label="Nombre completo"
          required
          value={valores.nombre}
          onChange={(e) => setCampo('nombre', e.target.value)}
          error={errores.nombre}
          maxLength={150}
        />
        <TextField label="Cargo" value={valores.cargo} onChange={(e) => setCampo('cargo', e.target.value)} error={errores.cargo} maxLength={100} />
        <SelectField
          label="Área"
          value={valores.areaId}
          onChange={(e) => setCampo('areaId', e.target.value)}
          error={errores.areaId}
          placeholder={cargandoAreas ? 'Cargando áreas…' : 'Sin área'}
          options={areas.map((a) => ({ value: a.id, label: a.nombre }))}
        />
        <TextField
          label="Teléfono"
          type="tel"
          value={valores.telefono}
          onChange={(e) => setCampo('telefono', e.target.value)}
          error={errores.telefono}
          maxLength={30}
        />
        <TextField
          label="Dirección"
          value={valores.direccion}
          onChange={(e) => setCampo('direccion', e.target.value)}
          error={errores.direccion}
          maxLength={255}
        />
        <label className="sm:col-span-2 flex min-h-[44px] cursor-pointer items-center gap-3 text-sm text-white/80">
          <input
            type="checkbox"
            checked={valores.isActive}
            onChange={(e) => setCampo('isActive', e.target.checked)}
            className="h-5 w-5 accent-[#e3b341]"
          />
          Empleado activo
        </label>
      </form>
    </Modal>
  );
}
