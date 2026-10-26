'use client';

/**
 * auditoriaColumns.tsx — Columnas de la bitácora de auditoría.
 */

import type { DataTableColumn } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { formatFechaHora } from '@/lib/format/fecha';
import type { LogAuditoria } from '../../types';
import { etiquetaAccion, etiquetaEntidad, TONO_ACCION } from './auditoria.etiquetas';

export function columnasAuditoria(onDetalle: (log: LogAuditoria) => void): DataTableColumn<LogAuditoria>[] {
  return [
    { key: 'fecha', header: 'Fecha', render: (l) => <span className="whitespace-nowrap">{formatFechaHora(l.fecha)}</span> },
    {
      key: 'actor',
      header: 'Actor',
      render: (l) => (l.usuarioNombre ? <span className="text-white">{l.usuarioNombre}</span> : <span className="text-white/45">Sistema / anónimo</span>),
    },
    { key: 'accion', header: 'Acción', render: (l) => <Badge tone={TONO_ACCION[l.accion] ?? 'neutral'}>{etiquetaAccion(l.accion)}</Badge> },
    {
      key: 'entidad',
      header: 'Entidad',
      render: (l) => (
        <div>
          <p>{etiquetaEntidad(l.entidad)}</p>
          {l.entidadId && (
            <p className="max-w-[180px] truncate text-xs text-white/45" title={l.entidadId}>
              {l.entidadId}
            </p>
          )}
        </div>
      ),
    },
    { key: 'ip', header: 'IP', render: (l) => <span className="text-white/60">{l.ip ?? '—'}</span> },
    {
      key: 'detalle',
      header: 'Detalle',
      align: 'right',
      render: (l) => (
        <button
          type="button"
          onClick={() => onDetalle(l)}
          className="min-h-[44px] rounded-lg px-3 text-xs uppercase tracking-wider text-[#e9b949] hover:bg-[#e3b341]/15 font-[family-name:var(--font-ui)] cursor-pointer"
        >
          Ver
        </button>
      ),
    },
  ];
}
