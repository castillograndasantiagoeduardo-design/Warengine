'use client';

/**
 * SucursalAreas.tsx — Áreas organizativas de la sede (Bodega, Mostrador, Caja…).
 */

import { Button3D } from '@/components/ui/Button3D';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TextField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { SectionCard } from '@/components/ui/SectionCard';
import { Spinner } from '@/components/ui/Spinner';
import { useAreas } from '../../../hooks/useAreas';

const BTN = 'min-h-[44px] min-w-[44px] rounded-lg px-2 text-xs uppercase tracking-wider font-[family-name:var(--font-pixelify)] cursor-pointer';

export function SucursalAreas({ sucursalId }: { sucursalId: number }) {
  const a = useAreas(sucursalId);
  const { valores, errores, errorGeneral, enviando, setCampo, handleSubmit } = a.form;
  const formId = 'form-area';

  return (
    <>
      <SectionCard
        title="Áreas"
        subtitle="Estructura organizativa de la sede"
        loading={a.loading}
        error={a.error}
        denied={a.denegado}
        onRetry={a.recargar}
        isEmpty={a.areas.length === 0}
        emptyTitle="Sin áreas"
        emptyDescription="Crea áreas como Bodega o Mostrador para organizar al personal."
        actions={
          <Button3D size="panel-sm" type="button" onClick={a.abrirCrear}>
            + Nueva área
          </Button3D>
        }
      >
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {a.areas.map((area) => (
            <li key={area.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0d1630] pl-4 pr-1">
              <span className="truncate text-sm text-white">{area.nombre}</span>
              <span className="flex shrink-0">
                <button type="button" className={`${BTN} text-[#e9b949] hover:bg-[#e3b341]/15`} onClick={() => a.abrirEditar(area)} aria-label={`Renombrar ${area.nombre}`}>
                  Editar
                </button>
                <button type="button" className={`${BTN} text-red-300 hover:bg-red-500/15`} onClick={() => a.solicitarEliminar(area)} aria-label={`Eliminar ${area.nombre}`}>
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <Modal
        open={a.formAbierto}
        onClose={a.cerrarForm}
        locked={enviando}
        size="sm"
        title={a.enEdicion ? 'Renombrar área' : 'Nueva área'}
        footer={
          <>
            <Button3D size="panel" variant="navy" type="button" onClick={a.cerrarForm} disabled={enviando}>
              Cancelar
            </Button3D>
            <Button3D size="panel" type="submit" form={formId} disabled={enviando}>
              {enviando && <Spinner size={16} />}
              Guardar
            </Button3D>
          </>
        }
      >
        <form id={formId} onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          {errorGeneral && <p role="alert" className="text-sm text-red-300">{errorGeneral}</p>}
          <TextField
            label="Nombre del área"
            required
            placeholder="Ej. Bodega"
            value={valores.nombre}
            onChange={(e) => setCampo('nombre', e.target.value)}
            error={errores.nombre}
            maxLength={100}
            autoComplete="off"
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={a.aEliminar !== null}
        title="Eliminar área"
        confirmLabel="Eliminar"
        loading={a.eliminando}
        onConfirm={a.confirmarEliminar}
        onCancel={a.cancelarEliminar}
        message={
          <p>
            ¿Eliminar el área <strong className="text-white">{a.aEliminar?.nombre}</strong>? Solo es posible si no tiene empleados asignados.
          </p>
        }
      />
    </>
  );
}
