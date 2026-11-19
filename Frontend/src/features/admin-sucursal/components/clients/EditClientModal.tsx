'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { actualizarClienteSchema } from '@warengine/contracts';
import type { ActualizarClienteInput, ClienteDto } from '../../types/branch-clients.types';
import { Loader2 } from 'lucide-react';

interface EditClientModalProps {
  cliente: ClienteDto | null;
  isOpen: boolean;
  onClose: () => void;
  onClienteActualizado: (cliente: ClienteDto) => void;
  onSubmit: (id: string, input: ActualizarClienteInput) => Promise<ClienteDto>;
}

export function EditClientModal({
  cliente,
  isOpen,
  onClose,
  onClienteActualizado,
  onSubmit,
}: EditClientModalProps) {
  const [nombreRazonSocial, setNombreRazonSocial] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [email, setEmail] = useState('');

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (cliente) {
      setNombreRazonSocial(cliente.nombreRazonSocial || '');
      setTelefono(cliente.telefono || '');
      setDireccion(cliente.direccion || '');
      setEmail(cliente.email || '');
      setErrores({});
      setErrorGeneral(null);
    }
  }, [cliente]);

  if (!cliente) return null;

  const handleClose = () => {
    if (!enviando) {
      setErrores({});
      setErrorGeneral(null);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrores({});
    setErrorGeneral(null);

    // Si es B2B, teléfono y dirección no pueden quedar vacíos
    if (cliente.tipoCliente === 'B2B') {
      if (!telefono.trim()) {
        setErrores((prev) => ({ ...prev, telefono: 'El teléfono es obligatorio para clientes B2B.' }));
        return;
      }
      if (!direccion.trim()) {
        setErrores((prev) => ({ ...prev, direccion: 'La dirección es obligatoria para clientes B2B.' }));
        return;
      }
    }

    const payload: ActualizarClienteInput = {
      nombreRazonSocial: nombreRazonSocial.trim(),
      email: email.trim() || undefined,
      telefono: telefono.trim() || undefined,
      direccion: direccion.trim() || undefined,
    };

    const parsed = actualizarClienteSchema.safeParse(payload);
    if (!parsed.success) {
      const errMap: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = String(issue.path[0] || 'general');
        errMap[path] = issue.message;
      }
      setErrores(errMap);
      return;
    }

    setEnviando(true);
    try {
      const res = await onSubmit(cliente.id, parsed.data);
      onClienteActualizado(res);
      onClose();
    } catch (err: any) {
      setErrorGeneral(
        err?.message || 'Error al actualizar el cliente. Verifica los datos.',
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Editar Cliente"
      description={`Actualiza la información de ${cliente.nombreRazonSocial}`}
      size="md"
      locked={enviando}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorGeneral && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorGeneral}
          </div>
        )}

        {/* Documento (solo lectura) */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              Documento Fiscal (No editable)
            </span>
            <span className="font-mono text-sm font-semibold text-white">
              {cliente.tipoDocumento} {cliente.numeroDocumento}
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
              cliente.tipoCliente === 'B2B'
                ? 'bg-purple-500/15 text-purple-300'
                : 'bg-blue-500/15 text-blue-300'
            }`}
          >
            {cliente.tipoCliente}
          </span>
        </div>

        {/* Nombre / Razón Social */}
        <div>
          <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
            {cliente.tipoCliente === 'B2B' ? 'Razón Social *' : 'Nombre Completo *'}
          </label>
          <input
            type="text"
            value={nombreRazonSocial}
            onChange={(e) => setNombreRazonSocial(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl bg-white/[0.05] border text-white text-sm focus:outline-none ${
              errores.nombreRazonSocial
                ? 'border-rose-500/60 focus:border-rose-500'
                : 'border-white/10 focus:border-[#e3b341]/60'
            }`}
          />
          {errores.nombreRazonSocial && (
            <p className="text-[11px] text-rose-400 mt-1">{errores.nombreRazonSocial}</p>
          )}
        </div>

        {/* Teléfono y Correo */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
              Teléfono {cliente.tipoCliente === 'B2B' ? '*' : '(opcional)'}
            </label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl bg-white/[0.05] border text-white text-sm focus:outline-none ${
                errores.telefono
                  ? 'border-rose-500/60 focus:border-rose-500'
                  : 'border-white/10 focus:border-[#e3b341]/60'
              }`}
            />
            {errores.telefono && (
              <p className="text-[11px] text-rose-400 mt-1">{errores.telefono}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
              Correo Electrónico (opcional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl bg-white/[0.05] border text-white text-sm focus:outline-none ${
                errores.email
                  ? 'border-rose-500/60 focus:border-rose-500'
                  : 'border-white/10 focus:border-[#e3b341]/60'
              }`}
            />
            {errores.email && (
              <p className="text-[11px] text-rose-400 mt-1">{errores.email}</p>
            )}
          </div>
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
            Dirección {cliente.tipoCliente === 'B2B' ? '*' : '(opcional)'}
          </label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl bg-white/[0.05] border text-white text-sm focus:outline-none ${
              errores.direccion
                ? 'border-rose-500/60 focus:border-rose-500'
                : 'border-white/10 focus:border-[#e3b341]/60'
            }`}
          />
          {errores.direccion && (
            <p className="text-[11px] text-rose-400 mt-1">{errores.direccion}</p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={handleClose}
            disabled={enviando}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-black bg-[#e3b341] hover:bg-[#d4a331] disabled:opacity-50 transition-colors shadow-lg shadow-[#e3b341]/20"
          >
            {enviando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{enviando ? 'Guardando...' : 'Guardar cambios'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
