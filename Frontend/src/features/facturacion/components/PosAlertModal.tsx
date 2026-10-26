'use client';

/**
 * PosAlertModal.tsx — Modal para emitir alertas operativas directas al Administrador de Sucursal.
 */

import React, { useState } from 'react';
import { posService } from '../api';

interface PosAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  sucursalId: number;
}

export function PosAlertModal({ isOpen, onClose, sucursalId }: PosAlertModalProps) {
  const [tipo, setTipo] = useState<string>('caja_falta_cambio');
  const [prioridad, setPrioridad] = useState<'normal' | 'urgente'>('urgente');
  const [mensaje, setMensaje] = useState<string>('');
  const [isEnviando, setIsEnviando] = useState<boolean>(false);
  const [enviadoExitoso, setEnviadoExitoso] = useState<boolean>(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim()) {
      setErrorLocal('El mensaje descriptivo de la alerta es obligatorio.');
      return;
    }

    setIsEnviando(true);
    setErrorLocal(null);

    try {
      await posService.enviarAlertaAdmin({
        sucursalId,
        tipo,
        mensaje: mensaje.trim(),
        prioridad,
      });
      setEnviadoExitoso(true);
      setTimeout(() => {
        setEnviadoExitoso(false);
        setMensaje('');
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setErrorLocal(err instanceof Error ? err.message : 'Error al enviar alerta a la administración.');
    } finally {
      setIsEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0f1b3d] border border-white/10 rounded-2xl p-6 shadow-2xl relative select-none">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white text-lg cursor-pointer"
        >
          &times;
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-xl">
            🔔
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-anton)] text-amber-400 text-xl tracking-wide uppercase">
              Alertar al Administrador
            </h3>
            <p className="text-xs text-white/60">Notificación prioritaria en tiempo real para soporte en caja</p>
          </div>
        </div>

        {enviadoExitoso ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center text-sm font-semibold">
            ✓ Alerta enviada con éxito al panel del Administrador.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorLocal && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {errorLocal}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-white/70 mb-1.5 font-[family-name:var(--font-pixelify)] uppercase">
                Motivo / Asunto
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0a1124] border border-white/20 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="caja_falta_cambio">Falta de Cambio en Gaveta (Monedas / Billetes)</option>
                <option value="caja_autorizacion">Solicitud de Autorización Especial</option>
                <option value="caja_falla_tecnica">Falla Técnica de Datáfono o Impresora</option>
                <option value="caja_cliente_disconforme">Asistencia en Mostrador</option>
                <option value="otro">Otro incidente operativo</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white/70 mb-1.5 font-[family-name:var(--font-pixelify)] uppercase">
                Nivel de Prioridad
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPrioridad('normal')}
                  className={`py-2 rounded-xl text-xs font-[family-name:var(--font-pixelify)] uppercase border cursor-pointer transition-all ${
                    prioridad === 'normal'
                      ? 'bg-blue-500/20 border-blue-400 text-blue-300 font-bold'
                      : 'bg-[#14213D] border-white/10 text-white/60'
                  }`}
                >
                  Informativa (Normal)
                </button>
                <button
                  type="button"
                  onClick={() => setPrioridad('urgente')}
                  className={`py-2 rounded-xl text-xs font-[family-name:var(--font-pixelify)] uppercase border cursor-pointer transition-all ${
                    prioridad === 'urgente'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-[#14213D] border-white/10 text-white/60'
                  }`}
                >
                  Urgente (Atención Inmediata)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white/70 mb-1.5 font-[family-name:var(--font-pixelify)] uppercase">
                Detalle del Mensaje *
              </label>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Describe brevemente la situación en la terminal de caja..."
                rows={3}
                required
                className="w-full p-3 rounded-xl bg-[#0a1124] border border-white/20 text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isEnviando}
                className="w-1/3 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs font-[family-name:var(--font-pixelify)] uppercase cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={isEnviando}
                className="w-2/3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-[family-name:var(--font-pixelify)] text-xs font-bold uppercase cursor-pointer shadow-[0_3px_0_#b45309] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                {isEnviando ? 'Enviando Alerta...' : 'Enviar Alerta al Admin'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
