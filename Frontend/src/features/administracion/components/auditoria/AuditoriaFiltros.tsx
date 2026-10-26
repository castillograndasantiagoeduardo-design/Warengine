'use client';

/**
 * AuditoriaFiltros.tsx — Filtros de la bitácora: rango de fechas, actor, acción y entidad.
 */

import type { SelectOption } from '@/components/ui/FormField';
import type { FiltrosAuditoria } from '../../types';
import { OPCIONES_ACCION, OPCIONES_ENTIDAD } from './auditoria.etiquetas';

interface AuditoriaFiltrosProps {
  filtros: FiltrosAuditoria;
  onCambio: <K extends keyof FiltrosAuditoria>(clave: K, valor: FiltrosAuditoria[K]) => void;
  opcionesActor: SelectOption[];
  error: string | null;
}

const ETIQUETA = 'flex flex-col gap-1 text-[11px] uppercase tracking-wider text-white/60 font-[family-name:var(--font-ui)]';
const vacio = (v: string) => (v === '' ? undefined : v);

export function AuditoriaFiltros({ filtros, onCambio, opcionesActor, error }: AuditoriaFiltrosProps) {
  return (
    <div className="mb-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className={ETIQUETA}>
          Desde
          <input type="date" className="panel-input" value={filtros.desde ?? ''} onChange={(e) => onCambio('desde', vacio(e.target.value))} />
        </label>
        <label className={ETIQUETA}>
          Hasta
          <input type="date" className="panel-input" value={filtros.hasta ?? ''} onChange={(e) => onCambio('hasta', vacio(e.target.value))} />
        </label>
        {opcionesActor.length > 0 && (
          <label className={ETIQUETA}>
            Actor
            <select className="panel-input cursor-pointer normal-case tracking-normal" value={filtros.usuarioId ?? ''} onChange={(e) => onCambio('usuarioId', vacio(e.target.value))}>
              <option value="">Todos</option>
              {opcionesActor.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className={ETIQUETA}>
          Acción
          <select className="panel-input cursor-pointer normal-case tracking-normal" value={filtros.accion ?? ''} onChange={(e) => onCambio('accion', vacio(e.target.value))}>
            <option value="">Todas</option>
            {OPCIONES_ACCION.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className={ETIQUETA}>
          Entidad
          <select className="panel-input cursor-pointer normal-case tracking-normal" value={filtros.entidad ?? ''} onChange={(e) => onCambio('entidad', vacio(e.target.value))}>
            <option value="">Todas</option>
            {OPCIONES_ENTIDAD.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
