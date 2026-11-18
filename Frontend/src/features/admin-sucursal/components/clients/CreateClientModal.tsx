'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { crearClienteSchema } from '@warengine/contracts';
import type { CrearClienteInput, ClienteDto } from '../../types/branch-clients.types';
import { Loader2 } from 'lucide-react';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClienteCreado: (cliente: ClienteDto) => void;
  onSubmit: (input: CrearClienteInput) => Promise<{ cliente: ClienteDto; yaExistia: boolean }>;
}

export function CreateClientModal({
  isOpen,
  onClose,
  onClienteCreado,
  onSubmit,
}: CreateClientModalProps) {
  const [tipoCliente, setTipoCliente] = useState<'B2C' | 'B2B'>('B2C');
  const [tipoDocumento, setTipoDocumento] = useState<'CC' | 'NIT' | 'RUT'>('CC');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [nombreRazonSocial, setNombreRazonSocial] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [email, setEmail] = useState('');

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const resetForm = () => {
    setTipoCliente('B2C');
    setTipoDocumento('CC');
    setNumeroDocumento('');
    setNombreRazonSocial('');
    setTelefono('');
    setDireccion('');
    setEmail('');
    setErrores({});
    setErrorGeneral(null);
  };

  const handleClose = () => {
    if (!enviando) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrores({});
    setErrorGeneral(null);

    const payload: CrearClienteInput = {
      tipoCliente,
      tipoDocumento,
      numeroDocumento: numeroDocumento.trim(),
      nombreRazonSocial: nombreRazonSocial.trim(),
      email: email.trim() || undefined,
      telefono: telefono.trim() || undefined,
      direccion: direccion.trim() || undefined,
    };

    const parsed = crearClienteSchema.safeParse(payload);
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
      const res = await onSubmit(parsed.data);
      onClienteCreado(res.cliente);
      resetForm();
      onClose();
    } catch (err: any) {
      setErrorGeneral(
        err?.message || 'Error al registrar el cliente. Verifica los datos ingresados.',
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Nuevo Cliente"
      description="Registra un cliente nuevo en el directorio comercial de Warengine."
      size="md"
      locked={enviando}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorGeneral && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorGeneral}
          </div>
        )}

        {/* Selector Tipo Cliente */}
        <div>
          <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
            Tipo de Cliente
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setTipoCliente('B2C');
                if (tipoDocumento === 'NIT') setTipoDocumento('CC');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                tipoCliente === 'B2C'
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-200'
                  : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              Persona Natural (B2C)
            </button>
            <button
              type="button"
              onClick={() => {
                setTipoCliente('B2B');
                if (tipoDocumento === 'CC') setTipoDocumento('NIT');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                tipoCliente === 'B2B'
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-200'
                  : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              Empresa / Corporativo (B2B)
            </button>
          </div>
        </div>

        {/* Documento (Tipo + Número) */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
              Tipo Doc
            </label>
            <select
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value as 'CC' | 'NIT' | 'RUT')}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-[#e3b341]/60"
            >
              <option value="CC" className="bg-[#1a0b16]">CC</option>
              <option value="NIT" className="bg-[#1a0b16]">NIT</option>
              <option value="RUT" className="bg-[#1a0b16]">RUT</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
              Número de Documento *
            </label>
            <input
              type="text"
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              placeholder="Ej: 900123456-1"
              className={`w-full px-3 py-2 rounded-xl bg-white/[0.05] border text-white font-mono text-sm focus:outline-none ${
                errores.numeroDocumento
                  ? 'border-rose-500/60 focus:border-rose-500'
                  : 'border-white/10 focus:border-[#e3b341]/60'
              }`}
            />
            {errores.numeroDocumento && (
              <p className="text-[11px] text-rose-400 mt-1">{errores.numeroDocumento}</p>
            )}
          </div>
        </div>

        {/* Nombre / Razón Social */}
        <div>
          <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
            {tipoCliente === 'B2B' ? 'Razón Social *' : 'Nombre Completo *'}
          </label>
          <input
            type="text"
            value={nombreRazonSocial}
            onChange={(e) => setNombreRazonSocial(e.target.value)}
            placeholder={tipoCliente === 'B2B' ? 'Distribuidora del Norte SAS' : 'Juan Pérez'}
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
              Teléfono {tipoCliente === 'B2B' ? '*' : '(opcional)'}
            </label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="310 123 4567"
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
              placeholder="contacto@empresa.com"
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
            Dirección {tipoCliente === 'B2B' ? '*' : '(opcional)'}
          </label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Calle 100 # 20-30, Oficina 401"
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
            <span>{enviando ? 'Guardando...' : 'Crear cliente'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
