'use client';

/**
 * SalarioModal.tsx — Trayectoria salarial del empleado y registro de un aumento (RF-ADM-C14).
 */

import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/FormField';
import { Button3D } from '@/components/ui/Button3D';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { formatCOP } from '@/lib/format/moneda';
import { formatFecha } from '@/lib/format/fecha';
import { useSalarios } from '../../hooks/useSalarios';
import type { Empleado } from '../../types';

interface SalarioModalProps {
  empleado: Empleado | null;
  onClose: () => void;
  onAumentoRegistrado: (sueldo: number) => void;
}

export function SalarioModal({ empleado, onClose, onAumentoRegistrado }: SalarioModalProps) {
  const { registros, cargando, error, denegado, form, enviar } = useSalarios(empleado, onAumentoRegistrado);
  const { valores, errores, errorGeneral, enviando, setCampo } = form;

  return (
    <Modal
      open={empleado !== null}
      onClose={onClose}
      locked={enviando}
      size="lg"
      title="Salario"
      description={empleado ? `${empleado.nombre} · sueldo actual ${empleado.sueldoActual !== null ? formatCOP(empleado.sueldoActual) : 'sin registrar'}` : undefined}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
          <h3 className="font-[family-name:var(--font-anton)] uppercase tracking-wider text-[#e9b949]">Registrar aumento</h3>
          {errorGeneral && <p role="alert" className="text-sm text-red-300">{errorGeneral}</p>}
          <TextField
            label="Nuevo sueldo (COP)"
            required
            type="number"
            inputMode="decimal"
            min={1}
            step="0.01"
            placeholder="Ej. 1800000"
            value={valores.sueldo}
            onChange={(e) => setCampo('sueldo', e.target.value)}
            error={errores.sueldo}
            hint={valores.sueldo && !errores.sueldo ? formatCOP(Number(valores.sueldo)) : undefined}
          />
          <TextField
            label="Fecha efectiva"
            type="date"
            value={valores.fechaEfectiva}
            onChange={(e) => setCampo('fechaEfectiva', e.target.value)}
            error={errores.fechaEfectiva}
          />
          <TextField
            label="Motivo"
            placeholder="Ej. Ajuste anual"
            value={valores.motivo}
            onChange={(e) => setCampo('motivo', e.target.value)}
            error={errores.motivo}
            maxLength={255}
          />
          <Button3D size="panel" type="submit" disabled={enviando}>
            {enviando && <Spinner size={16} />}
            Registrar aumento
          </Button3D>
        </form>

        <section aria-label="Historial salarial">
          <h3 className="mb-3 font-[family-name:var(--font-anton)] uppercase tracking-wider text-white">Historial</h3>
          {cargando && <Skeleton className="h-12 w-full" lines={3} />}
          {!cargando && denegado && <p className="text-sm text-amber-200">Acceso restringido: tu rol no puede ver el historial salarial.</p>}
          {!cargando && error && !denegado && <p className="text-sm text-red-300">{error}</p>}
          {!cargando && !error && registros.length === 0 && <p className="text-sm text-white/50">Aún no hay registros salariales.</p>}
          <ol className="flex flex-col gap-2">
            {registros.map((r, i) => (
              <li key={r.id} className={`rounded-xl border px-4 py-3 ${i === 0 ? 'border-[#e3b341]/40 bg-[#e3b341]/5' : 'border-white/10'}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <strong className="font-[family-name:var(--font-anton)] text-lg tracking-wide text-white">{formatCOP(r.sueldo)}</strong>
                  <span className="text-xs text-white/55">{formatFecha(r.fechaEfectiva)}</span>
                </div>
                {r.motivo && <p className="mt-1 text-sm text-white/70">{r.motivo}</p>}
                {r.registradorNombre && <p className="mt-1 text-[11px] text-white/45">Registrado por {r.registradorNombre}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Modal>
  );
}
