'use client';

/**
 * AlertaCard.tsx — Tarjeta de una alerta administrativa con sus acciones de estado.
 */

import { Badge } from '@/components/ui/Badge';
import { Button3D } from '@/components/ui/Button3D';
import { Spinner } from '@/components/ui/Spinner';
import { formatFechaHora } from '@/lib/format/fecha';
import type { AlertaAdmin } from '../../types';

const TONO_ESTADO = { pendiente: 'warning', visto: 'info', atendido: 'success' } as const;
const ETIQUETA_ESTADO = { pendiente: 'Pendiente', visto: 'Vista', atendido: 'Atendida' } as const;

interface AlertaCardProps {
  alerta: AlertaAdmin;
  procesando: boolean;
  onCambiar: (estado: 'visto' | 'atendido') => void;
}

export function AlertaCard({ alerta, procesando, onCambiar }: AlertaCardProps) {
  const urgente = alerta.prioridad === 'urgente';

  return (
    <article className={`panel-card flex flex-col gap-3 p-4 ${urgente && alerta.estado !== 'atendido' ? 'ring-1 ring-red-400/50' : ''}`}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-medium text-white">{alerta.motivo}</h3>
          <p className="text-xs text-white/50">
            {alerta.sucursalNombre ?? `Sucursal ${alerta.sucursalId}`} · {formatFechaHora(alerta.fechaCreacion)}
          </p>
        </div>
        <div className="flex gap-2">
          {urgente && <Badge tone="danger">Urgente</Badge>}
          <Badge tone={TONO_ESTADO[alerta.estado]}>{ETIQUETA_ESTADO[alerta.estado]}</Badge>
        </div>
      </header>

      {alerta.descripcion && <p className="text-sm text-white/75">{alerta.descripcion}</p>}

      <footer className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-white/45">
          Reportada por {alerta.usuarioEmail ?? 'un operador'}
          {alerta.fechaAtencion && ` · atendida ${formatFechaHora(alerta.fechaAtencion)}`}
        </span>
        {alerta.estado !== 'atendido' && (
          <div className="flex gap-2">
            {procesando && <Spinner size={18} />}
            {alerta.estado === 'pendiente' && (
              <Button3D size="panel-sm" variant="navy" type="button" disabled={procesando} onClick={() => onCambiar('visto')}>
                Marcar vista
              </Button3D>
            )}
            <Button3D size="panel-sm" variant="success" type="button" disabled={procesando} onClick={() => onCambiar('atendido')}>
              Atender
            </Button3D>
          </div>
        )}
      </footer>
    </article>
  );
}
