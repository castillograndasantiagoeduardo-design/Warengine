'use client';

/**
 * CrearUsuarioModal.tsx — Alta atómica de empleado + cuenta de usuario (RF-ADM-C6).
 */

import type { RolResumenDto } from '@warengine/contracts';
import { Modal } from '@/components/ui/Modal';
import { SelectField, TextField } from '@/components/ui/FormField';
import { Button3D } from '@/components/ui/Button3D';
import { Spinner } from '@/components/ui/Spinner';
import { etiquetaRol } from '@/lib/format/rol';
import { useCrearUsuarioForm } from '../../hooks/useCrearUsuarioForm';
import type { Sucursal, UsuarioGestionado } from '../../types';

interface CrearUsuarioModalProps {
  open: boolean;
  roles: RolResumenDto[];
  sucursales: Sucursal[];
  onClose: () => void;
  onCreado: (u: UsuarioGestionado) => void;
}

export function CrearUsuarioModal({ open, roles, sucursales, onClose, onCreado }: CrearUsuarioModalProps) {
  const { valores: v, errores: e, errorGeneral, enviando, setCampo, handleSubmit } = useCrearUsuarioForm(open, onCreado);
  const formId = 'form-crear-usuario';

  return (
    <Modal
      open={open}
      onClose={onClose}
      locked={enviando}
      size="lg"
      title="Nuevo usuario"
      description="Crea la ficha del empleado y su cuenta de acceso en un solo paso."
      footer={
        <>
          <Button3D size="panel" variant="navy" type="button" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button3D>
          <Button3D size="panel" type="submit" form={formId} disabled={enviando}>
            {enviando && <Spinner size={16} />}
            Crear usuario
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
        <TextField className="sm:col-span-2" label="Nombre completo" required value={v.nombre} onChange={(x) => setCampo('nombre', x.target.value)} error={e.nombre} maxLength={150} autoComplete="off" />
        <SelectField
          label="Tipo de documento"
          required
          value={v.tipoDocumento}
          onChange={(x) => setCampo('tipoDocumento', x.target.value as 'CC' | 'CE')}
          error={e.tipoDocumento}
          options={[
            { value: 'CC', label: 'Cédula de ciudadanía (CC)' },
            { value: 'CE', label: 'Cédula de extranjería (CE)' },
          ]}
        />
        <TextField label="Número de documento" required inputMode="numeric" value={v.numeroDocumento} onChange={(x) => setCampo('numeroDocumento', x.target.value)} error={e.numeroDocumento} maxLength={30} />
        <TextField label="Correo" required type="email" value={v.email} onChange={(x) => setCampo('email', x.target.value)} error={e.email} autoComplete="off" />
        <TextField
          label="Contraseña inicial"
          required
          type="password"
          autoComplete="new-password"
          value={v.password}
          onChange={(x) => setCampo('password', x.target.value)}
          error={e.password}
          hint="Mínimo 8 caracteres. Compártela por un canal seguro."
        />
        <SelectField
          label="Rol"
          required
          value={v.rolId}
          onChange={(x) => setCampo('rolId', x.target.value)}
          error={e.rolId}
          placeholder="Selecciona un rol"
          options={roles.map((r) => ({ value: r.id, label: etiquetaRol(r.nombre) }))}
        />
        <SelectField
          label="Sucursal principal"
          required
          value={v.sucursalId}
          onChange={(x) => setCampo('sucursalId', x.target.value)}
          error={e.sucursalId}
          placeholder="Selecciona una sucursal"
          options={sucursales.filter((s) => s.isActive).map((s) => ({ value: s.id, label: s.nombre }))}
        />
        <TextField className="sm:col-span-2" label="Cargo" value={v.cargo} onChange={(x) => setCampo('cargo', x.target.value)} error={e.cargo} maxLength={100} placeholder="Ej. Cajero, Administradora de sede" />
      </form>
    </Modal>
  );
}
