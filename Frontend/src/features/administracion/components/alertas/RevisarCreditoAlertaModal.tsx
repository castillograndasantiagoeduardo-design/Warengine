'use client';

/**
 * RevisarCreditoAlertaModal.tsx — Modal disparado desde una advertencia `SOLICITUD_CREDITO_B2B`
 * para que el Super Admin inspeccione el perfil completo de la empresa B2B y apruebe (liberando
 * el cupo de inmediato para cotizar) o rechace el crédito sin salir de la alerta.
 */

import { useEffect, useState } from 'react';
import { PLAZOS_CREDITO_DIAS, type ClienteDto, type PlazoCreditoDias } from '@warengine/contracts';
import { Badge } from '@/components/ui/Badge';
import { Button3D } from '@/components/ui/Button3D';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { apiClient, ApiError } from '@/lib/api';
import { formatFechaHora } from '@/lib/format/fecha';
import { alertasService } from '../../api';
import type { AlertaAdmin } from '../../types';

const TONO_RIESGO = { bajo: 'success', medio: 'warning', alto: 'danger' } as const;
const TONO_ESTADO_CREDITO = {
  sin_solicitud: 'neutral',
  pendiente_aprobacion: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
} as const;
const ETIQUETA_ESTADO_CREDITO = {
  sin_solicitud: 'Sin solicitud',
  pendiente_aprobacion: 'Pendiente de aprobación',
  aprobado: 'Crédito aprobado',
  rechazado: 'Crédito rechazado',
} as const;

interface RevisarCreditoAlertaModalProps {
  alerta: AlertaAdmin | null;
  clienteId: string | null;
  onClose: () => void;
  onResuelto: () => void;
}

export function RevisarCreditoAlertaModal({
  alerta,
  clienteId,
  onClose,
  onResuelto,
}: RevisarCreditoAlertaModalProps) {
  const toast = useToast();
  const [cliente, setCliente] = useState<ClienteDto | null>(null);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<'aprobar' | 'rechazar' | 'atender' | null>(null);
  const [cupoInput, setCupoInput] = useState('');
  const [plazoDias, setPlazoDias] = useState<PlazoCreditoDias>(30);
  const [motivo, setMotivo] = useState('');

  const abierto = Boolean(alerta && clienteId);

  useEffect(() => {
    if (!abierto || !clienteId) return;
    let activo = true;
    setCargando(true);
    setErrorCarga(null);
    setErrorAccion(null);
    setMotivo('');

    apiClient
      .get<ClienteDto>(`/ventas/clientes/${clienteId}`)
      .then((data) => {
        if (!activo) return;
        setCliente(data);
        setCupoInput(String(data.cupoCreditoSugerido ?? 0));
        const plazoValido = (PLAZOS_CREDITO_DIAS as readonly number[]).includes(
          data.plazoCreditoDias ?? 30,
        )
          ? ((data.plazoCreditoDias ?? 30) as PlazoCreditoDias)
          : 30;
        setPlazoDias(plazoValido);
      })
      .catch((err) => {
        if (!activo) return;
        setCliente(null);
        setErrorCarga(
          err instanceof ApiError
            ? err.message
            : 'No se pudo cargar la ficha de la empresa solicitante.',
        );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [abierto, clienteId]);

  const decidir = async (decision: 'aprobar' | 'rechazar') => {
    if (!cliente || !alerta) return;
    setErrorAccion(null);

    const cupo = Number(cupoInput || cliente.cupoCreditoSugerido || 0);
    const motivoLimpio = motivo.trim();

    if (decision === 'aprobar' && (!Number.isFinite(cupo) || cupo <= 0)) {
      setErrorAccion('Define un cupo de crédito mayor a $0 para liberar el crédito.');
      return;
    }
    if (decision === 'rechazar' && motivoLimpio.length < 5) {
      setErrorAccion('Para rechazar el crédito escribe un motivo de al menos 5 caracteres.');
      return;
    }

    setProcesando(decision);
    try {
      await apiClient.put(`/ventas/clientes/${cliente.id}/credito`, {
        decision,
        cupoAprobado: decision === 'aprobar' ? cupo : 0,
        plazoCreditoDias: plazoDias,
        motivo: motivoLimpio || undefined,
      });

      if (alerta.estado !== 'atendido') {
        await alertasService.cambiarEstado(alerta.id, 'atendido').catch(() => undefined);
      }

      toast.success(
        decision === 'aprobar'
          ? `Crédito liberado para ${cliente.nombreRazonSocial} por $${cupo.toLocaleString('es-CO')} COP. El vendedor B2B ya puede cotizarle a crédito.`
          : `Solicitud de crédito rechazada para ${cliente.nombreRazonSocial}.`,
      );
      onResuelto();
      onClose();
    } catch (err) {
      setErrorAccion(
        err instanceof ApiError ? err.message : 'No se pudo registrar la decisión de crédito.',
      );
    } finally {
      setProcesando(null);
    }
  };

  const marcarAtendida = async () => {
    if (!alerta) return;
    setProcesando('atender');
    try {
      await alertasService.cambiarEstado(alerta.id, 'atendido');
      toast.success('Alerta marcada como atendida.');
      onResuelto();
      onClose();
    } catch (err) {
      setErrorAccion(err instanceof ApiError ? err.message : 'No se pudo actualizar la alerta.');
    } finally {
      setProcesando(null);
    }
  };

  const estadoCredito = cliente?.estadoCredito ?? 'sin_solicitud';
  const pendienteDecision = estadoCredito === 'pendiente_aprobacion';
  const riesgo = cliente?.nivelRiesgoCredito ?? 'medio';

  const footer = (
    <>
      <Button3D
        size="panel-sm"
        variant="navy"
        type="button"
        disabled={procesando !== null}
        onClick={onClose}
      >
        Cerrar
      </Button3D>
      {cliente && pendienteDecision && (
        <>
          <Button3D
            size="panel-sm"
            variant="danger"
            type="button"
            disabled={procesando !== null}
            onClick={() => void decidir('rechazar')}
          >
            {procesando === 'rechazar' ? 'Rechazando...' : 'Rechazar crédito'}
          </Button3D>
          <Button3D
            size="panel-sm"
            variant="success"
            type="button"
            disabled={procesando !== null}
            onClick={() => void decidir('aprobar')}
          >
            {procesando === 'aprobar' ? 'Liberando cupo...' : 'Aprobar y liberar crédito'}
          </Button3D>
        </>
      )}
      {cliente && !pendienteDecision && alerta && alerta.estado !== 'atendido' && (
        <Button3D
          size="panel-sm"
          variant="success"
          type="button"
          disabled={procesando !== null}
          onClick={() => void marcarAtendida()}
        >
          {procesando === 'atender' ? 'Guardando...' : 'Marcar alerta atendida'}
        </Button3D>
      )}
    </>
  );

  return (
    <Modal
      open={abierto}
      onClose={onClose}
      title="Perfil de Empresa B2B — Decisión de Crédito"
      description={
        alerta
          ? `${alerta.sucursalNombre ?? `Sucursal ${alerta.sucursalId}`} · Solicitado ${formatFechaHora(alerta.fechaCreacion)}`
          : undefined
      }
      size="lg"
      locked={procesando !== null}
      footer={footer}
    >
      {cargando && (
        <div className="flex items-center justify-center gap-3 py-10 text-sm text-white/70">
          <Spinner size={22} />
          <span>Cargando información de la empresa solicitante...</span>
        </div>
      )}

      {!cargando && errorCarga && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          {errorCarga}
        </div>
      )}

      {!cargando && cliente && (
        <div className="space-y-4 text-xs text-white/80">
          {/* Cabecera de la empresa */}
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/50">Razón Social</p>
              <h3 className="text-base font-semibold text-white">{cliente.nombreRazonSocial}</h3>
              <p className="mt-0.5 font-mono text-xs text-white/65">
                {cliente.tipoDocumento} {cliente.numeroDocumento} · Cliente {cliente.tipoCliente}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={TONO_RIESGO[riesgo]}>Riesgo {riesgo}</Badge>
              <Badge tone={TONO_ESTADO_CREDITO[estadoCredito]}>
                {ETIQUETA_ESTADO_CREDITO[estadoCredito]}
              </Badge>
            </div>
          </div>

          {/* Datos de contacto y ubicación */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:grid-cols-2">
            <div>
              <span className="block text-[11px] text-white/50">Dirección comercial</span>
              <span className="font-medium text-white">{cliente.direccion || 'No registrada'}</span>
            </div>
            <div>
              <span className="block text-[11px] text-white/50">Teléfono</span>
              <span className="font-medium text-white">{cliente.telefono || 'No registrado'}</span>
            </div>
            <div>
              <span className="block text-[11px] text-white/50">Correo electrónico</span>
              <span className="font-medium text-white">{cliente.email || 'No registrado'}</span>
            </div>
            <div>
              <span className="block text-[11px] text-white/50">Registrada por</span>
              <span className="font-medium text-white">
                {alerta?.usuarioEmail ?? 'Operador comercial'}
              </span>
            </div>
          </div>

          {/* Evaluación financiera */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#e3b341]/30 bg-[#e3b341]/5 p-4 sm:grid-cols-3">
            <div>
              <span className="block text-[11px] text-white/60">Ganancia neta mensual</span>
              <span className="text-sm font-semibold tabular-nums text-white">
                ${(cliente.gananciaNetaMensual ?? 0).toLocaleString('es-CO')} COP
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-white/60">Cupo sugerido (reglas)</span>
              <span className="text-sm font-semibold tabular-nums text-[#e9b949]">
                ${(cliente.cupoCreditoSugerido ?? 0).toLocaleString('es-CO')} COP
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-white/60">Antigüedad / Plazo</span>
              <span className="text-sm font-semibold tabular-nums text-white">
                {cliente.antiguedadEmpresaMeses ?? 'N/D'} meses · {cliente.plazoCreditoDias ?? 30} días
              </span>
            </div>
          </div>

          {cliente.observacionFinanciera && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-[11px] text-white/50">Respaldo financiero declarado</span>
              <p className="mt-1 text-xs text-white/85">{cliente.observacionFinanciera}</p>
            </div>
          )}

          {/* Formulario de decisión directa si está pendiente */}
          {pendienteDecision ? (
            <div className="space-y-3 rounded-xl border border-emerald-400/25 bg-emerald-500/5 p-4">
              <p className="text-xs text-emerald-200">
                Al aprobar, el cupo queda <strong>liberado de inmediato</strong> para que el vendedor B2B pueda cotizar a crédito corporativo sin pasos adicionales.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] text-white/70">
                    Cupo final a liberar (COP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100000}
                    value={cupoInput}
                    onChange={(e) => setCupoInput(e.target.value)}
                    className="panel-input w-full tabular-nums"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-white/70">Plazo (días)</label>
                  <select
                    value={plazoDias}
                    onChange={(e) => setPlazoDias(Number(e.target.value) as PlazoCreditoDias)}
                    className="panel-input w-full cursor-pointer"
                  >
                    {PLAZOS_CREDITO_DIAS.map((d) => (
                      <option key={d} value={d}>
                        {d} días
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-white/70">
                  Nota / motivo de decisión (opcional al aprobar, obligatorio al rechazar)
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej. Estados financieros verificados / Empresa sin historial suficiente..."
                  className="panel-input w-full"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-1">
              <p className="text-xs font-semibold text-white">
                {estadoCredito === 'aprobado'
                  ? `Crédito ya aprobado y activo por $${(cliente.cupoCreditoAprobado ?? 0).toLocaleString('es-CO')} COP (Disponible: $${(cliente.cupoCreditoDisponible ?? 0).toLocaleString('es-CO')} COP).`
                  : 'Esta solicitud de crédito ya fue rechazada.'}
              </p>
              {cliente.motivoDecisionCredito && (
                <p className="text-xs text-white/65">Motivo: {cliente.motivoDecisionCredito}</p>
              )}
              {cliente.creditoAprobadoEn && (
                <p className="text-[11px] text-white/45">
                  Decidido el {formatFechaHora(cliente.creditoAprobadoEn)}
                </p>
              )}
            </div>
          )}

          {errorAccion && (
            <div className="rounded-xl border border-red-400/30 bg-red-500/15 p-3 text-xs text-red-200">
              {errorAccion}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
