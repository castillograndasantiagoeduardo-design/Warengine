'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { branchAssetsService } from '../../api/branch-assets.service';
import { apiClient } from '@/lib/api';
import type { ActivoSede, RegistrarMantenimientoDTO, TipoMantenimiento } from '../../types/branch-assets.types';

interface RegisterMaintenanceModalProps {
  open: boolean;
  sucursalId: number;
  activoPreseleccionado?: ActivoSede | null;
  onClose: () => void;
  onSubmit: (activoId: string, datos: RegistrarMantenimientoDTO) => Promise<any>;
}

export function RegisterMaintenanceModal({
  open,
  sucursalId,
  activoPreseleccionado,
  onClose,
  onSubmit,
}: RegisterMaintenanceModalProps) {
  const [activoId, setActivoId] = useState('');
  const [activosDisponibles, setActivosDisponibles] = useState<ActivoSede[]>([]);
  const [tipo, setTipo] = useState<TipoMantenimiento>('preventivo');
  const [proveedorId, setProveedorId] = useState<number | ''>('');
  const [proveedores, setProveedores] = useState<Array<{ id: number; nombre: string }>>([]);
  const [fecha, setFecha] = useState('');
  const [costo, setCosto] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setActivoId(activoPreseleccionado?.id || '');
    setTipo('preventivo');
    setProveedorId('');
    setFecha(new Date().toISOString().split('T')[0]);
    setCosto('');
    setDescripcion('');
    setError(null);

    let montado = true;

    // Si no hay activo preseleccionado, cargar lista de activos que no estén de baja
    if (!activoPreseleccionado) {
      branchAssetsService.listarActivos(sucursalId, { limit: 100 })
        .then((res) => {
          if (montado) {
            setActivosDisponibles(res.items.filter((a) => a.estado !== 'baja'));
          }
        })
        .catch(() => {});
    }

    // Cargar proveedores disponibles
    apiClient.get<any>('/inventario/proveedores', { params: { limit: 100, isActive: true } })
      .then((res) => {
        const items = Array.isArray(res) ? res : (res?.items || []);
        if (montado) {
          setProveedores(items.map((p: any) => ({
            id: Number(p.id || p.id_proveedor),
            nombre: String(p.nombre || ''),
          })));
        }
      })
      .catch(() => {});

    return () => {
      montado = false;
    };
  }, [open, activoPreseleccionado, sucursalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idFinal = activoPreseleccionado?.id || activoId;
    if (!idFinal) {
      setError('Debes seleccionar un activo para registrar el mantenimiento.');
      return;
    }
    if (!fecha) {
      setError('La fecha de inicio es requerida.');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const costoNum = costo.trim() !== '' ? Number(costo) : null;
      await onSubmit(idFinal, {
        proveedorId: proveedorId !== '' ? Number(proveedorId) : null,
        tipo,
        fecha,
        costo: costoNum,
        descripcion: descripcion.trim() || null,
      });
      onClose();
    } catch (err: any) {
      const msg = err?.issues?.[0]?.message || err?.message || 'Error al registrar el mantenimiento.';
      setError(msg);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar Mantenimiento Técnico"
      description="Inicia un servicio preventivo o correctivo para un activo de la sede."
      size="md"
      locked={guardando}
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={guardando}
            className="px-4 py-2 text-xs font-semibold text-neutral-900 bg-white hover:bg-neutral-200 active:scale-[0.98] rounded-xl transition-all shadow-sm"
          >
            {guardando ? 'Guardando...' : 'Iniciar mantenimiento'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Activo Selector o Card */}
        {activoPreseleccionado ? (
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs space-y-1">
            <span className="text-neutral-400">Activo objetivo:</span>
            <div className="font-semibold text-neutral-100 flex items-center gap-2">
              <span>{activoPreseleccionado.nombre}</span>
              <span className="font-mono text-xs text-neutral-400">({activoPreseleccionado.codigoActivo})</span>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Activo a intervenir *
            </label>
            <select
              required
              value={activoId}
              onChange={(e) => setActivoId(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-100 focus:outline-none focus:border-white/30 cursor-pointer"
            >
              <option value="" className="bg-neutral-900 text-neutral-400">Seleccionar activo...</option>
              {activosDisponibles.map((a) => (
                <option key={a.id} value={a.id} className="bg-neutral-900 text-neutral-100">
                  {a.codigoActivo} — {a.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Tipo de servicio *
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoMantenimiento)}
              className="w-full px-3 py-2 bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-200 focus:outline-none focus:border-white/30 cursor-pointer"
            >
              <option value="preventivo" className="bg-neutral-900 text-neutral-200">Preventivo (Programado)</option>
              <option value="correctivo" className="bg-neutral-900 text-neutral-200">Correctivo (Reparación)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Proveedor / Taller técnico
            </label>
            <select
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-200 focus:outline-none focus:border-white/30 cursor-pointer"
            >
              <option value="" className="bg-neutral-900 text-neutral-200">Interno / Sin proveedor</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id} className="bg-neutral-900 text-neutral-200">
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Fecha de inicio *
            </label>
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2 font-mono bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-200 focus:outline-none focus:border-white/30 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Costo estimado (COP)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 font-mono bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-white/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            Descripción de la intervención técnica
          </label>
          <textarea
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej. Cambio de pasta térmica, limpieza de disipador y actualización de firmware..."
            className="w-full px-3 py-2 bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-white/30 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
