'use client';

/**
 * PosClienteModal.tsx — Modal para búsqueda y registro ágil de clientes en el POS.
 */

import React, { useState } from 'react';
import type { ClienteDto, CrearClienteInput } from '../types/pos.types';

interface PosClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteActual: ClienteDto | null;
  onSeleccionarCliente: (cliente: ClienteDto) => void;
  onCrearCliente: (input: CrearClienteInput) => Promise<ClienteDto>;
  clientesEncontrados: ClienteDto[];
  terminoBusqueda: string;
  onCambiarTerminoBusqueda: (termino: string) => void;
  isBuscando: boolean;
  isCreando: boolean;
}

export function PosClienteModal({
  isOpen,
  onClose,
  clienteActual,
  onSeleccionarCliente,
  onCrearCliente,
  clientesEncontrados,
  terminoBusqueda,
  onCambiarTerminoBusqueda,
  isBuscando,
  isCreando,
}: PosClienteModalProps) {
  const [modoCrear, setModoCrear] = useState<boolean>(false);

  // Formulario nuevo cliente
  const [tipoDocumento, setTipoDocumento] = useState<'CC' | 'NIT' | 'RUT'>('CC');
  const [numeroDocumento, setNumeroDocumento] = useState<string>('');
  const [nombreRazonSocial, setNombreRazonSocial] = useState<string>('');
  const [tipoCliente, setTipoCliente] = useState<'B2C' | 'B2B'>('B2C');
  const [email, setEmail] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [errorCrear, setErrorCrear] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitNuevoCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCrear(null);

    if (!numeroDocumento.trim() || !nombreRazonSocial.trim()) {
      setErrorCrear('Documento y Nombre son campos obligatorios.');
      return;
    }

    if (tipoCliente === 'B2B' && (!telefono.trim() || !direccion.trim())) {
      setErrorCrear('Para clientes corporativos B2B, teléfono y dirección son obligatorios por ley fiscal.');
      return;
    }

    try {
      await onCrearCliente({
        tipoDocumento,
        numeroDocumento: numeroDocumento.trim(),
        nombreRazonSocial: nombreRazonSocial.trim(),
        tipoCliente,
        email: email.trim() || undefined,
        telefono: telefono.trim() || undefined,
        direccion: direccion.trim() || undefined,
      });
      setModoCrear(false);
      onClose();
    } catch (err: unknown) {
      setErrorCrear(err instanceof Error ? err.message : 'Error al guardar el cliente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0f1b3d] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white text-lg cursor-pointer"
        >
          &times;
        </button>

        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div>
            <h3 className="font-[family-name:var(--font-anton)] text-[#e3b341] text-xl tracking-wide uppercase">
              {modoCrear ? 'Nuevo Cliente' : 'Directorio de Clientes'}
            </h3>
            <p className="text-xs text-white/60">
              {modoCrear
                ? 'Registra datos del cliente para su factura'
                : 'Busca por CC / NIT o nombre, o registra un cliente nuevo'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModoCrear(!modoCrear)}
            className="px-3 py-1.5 rounded-xl bg-[#14213D] hover:bg-[#1a2b50] border border-white/10 text-xs font-[family-name:var(--font-pixelify)] text-[#e3b341] uppercase cursor-pointer transition-colors"
          >
            {modoCrear ? '← Buscar Existente' : '+ Registrar Nuevo'}
          </button>
        </div>

        {!modoCrear ? (
          /* ========================================================
             BUSCAR CLIENTE
             ======================================================== */
          <div className="space-y-4">
            {/* Input de Búsqueda */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                🔍
              </span>
              <input
                type="text"
                value={terminoBusqueda}
                onChange={(e) => onCambiarTerminoBusqueda(e.target.value)}
                placeholder="Buscar por cédula, NIT, nombre o razón social..."
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a1124] border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-[#e3b341]"
              />
            </div>

            {/* Lista de resultados */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {isBuscando ? (
                <div className="py-6 text-center text-xs text-white/40 font-[family-name:var(--font-pixelify)]">
                  Buscando clientes en el sistema...
                </div>
              ) : clientesEncontrados.length === 0 && terminoBusqueda.length >= 2 ? (
                <div className="py-6 text-center text-xs text-white/40">
                  No se encontraron clientes con ese criterio.
                </div>
              ) : (
                clientesEncontrados.map((cli) => (
                  <div
                    key={cli.id}
                    onClick={() => {
                      onSeleccionarCliente(cli);
                      onClose();
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      clienteActual?.id === cli.id
                        ? 'bg-[#e3b341]/10 border-[#e3b341]'
                        : 'bg-[#0a1124] hover:bg-[#14213D] border-white/5'
                    }`}
                  >
                    <div>
                      <h5 className="text-xs font-semibold text-white">{cli.nombreRazonSocial}</h5>
                      <p className="text-[11px] text-white/50 font-mono">
                        {cli.tipoDocumento}: {cli.numeroDocumento} · {cli.tipoCliente}
                      </p>
                    </div>
                    <span className="text-xs text-[#e3b341] font-bold font-[family-name:var(--font-pixelify)]">
                      Elegir &rarr;
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* ========================================================
             CREAR CLIENTE NUEVO
             ======================================================== */
          <form onSubmit={handleSubmitNuevoCliente} className="space-y-3">
            {errorCrear && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {errorCrear}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-white/70 mb-1 font-[family-name:var(--font-pixelify)] uppercase">
                  Tipo Documento
                </label>
                <select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value as 'CC' | 'NIT' | 'RUT')}
                  className="w-full px-3 py-2 rounded-xl bg-[#0a1124] border border-white/20 text-white text-xs focus:outline-none focus:border-[#e3b341]"
                >
                  <option value="CC">Cédula de Ciudadanía (CC)</option>
                  <option value="NIT">NIT (Empresas)</option>
                  <option value="RUT">RUT</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/70 mb-1 font-[family-name:var(--font-pixelify)] uppercase">
                  Número Documento *
                </label>
                <input
                  type="text"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  placeholder="1020304050"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#0a1124] border border-white/20 text-white text-xs focus:outline-none focus:border-[#e3b341]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white/70 mb-1 font-[family-name:var(--font-pixelify)] uppercase">
                Nombre Completo o Razón Social *
              </label>
              <input
                type="text"
                value={nombreRazonSocial}
                onChange={(e) => setNombreRazonSocial(e.target.value)}
                placeholder="Ej. Juan Pérez o Distribuidora SAS"
                required
                className="w-full px-3 py-2 rounded-xl bg-[#0a1124] border border-white/20 text-white text-xs focus:outline-none focus:border-[#e3b341]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-white/70 mb-1 font-[family-name:var(--font-pixelify)] uppercase">
                  Tipo de Cliente
                </label>
                <select
                  value={tipoCliente}
                  onChange={(e) => setTipoCliente(e.target.value as 'B2C' | 'B2B')}
                  className="w-full px-3 py-2 rounded-xl bg-[#0a1124] border border-white/20 text-white text-xs focus:outline-none focus:border-[#e3b341]"
                >
                  <option value="B2C">B2C (Persona Natural)</option>
                  <option value="B2B">B2B (Corporativo / Empresa)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/70 mb-1 font-[family-name:var(--font-pixelify)] uppercase">
                  Teléfono {tipoCliente === 'B2B' && '*'}
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="3001234567"
                  required={tipoCliente === 'B2B'}
                  className="w-full px-3 py-2 rounded-xl bg-[#0a1124] border border-white/20 text-white text-xs focus:outline-none focus:border-[#e3b341]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-white/70 mb-1 font-[family-name:var(--font-pixelify)] uppercase">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#0a1124] border border-white/20 text-white text-xs focus:outline-none focus:border-[#e3b341]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/70 mb-1 font-[family-name:var(--font-pixelify)] uppercase">
                  Dirección {tipoCliente === 'B2B' && '*'}
                </label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Calle 100 # 15-20"
                  required={tipoCliente === 'B2B'}
                  className="w-full px-3 py-2 rounded-xl bg-[#0a1124] border border-white/20 text-white text-xs focus:outline-none focus:border-[#e3b341]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setModoCrear(false)}
                className="w-1/3 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs font-[family-name:var(--font-pixelify)] uppercase cursor-pointer"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={isCreando}
                className="w-2/3 py-2.5 rounded-xl bg-[#e3b341] hover:bg-[#e9b949] text-black font-[family-name:var(--font-pixelify)] text-xs font-bold uppercase cursor-pointer shadow-[0_3px_0_#b88a1f] active:translate-y-0.5 active:shadow-none"
              >
                {isCreando ? 'Guardando...' : 'Guardar y Asignar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
