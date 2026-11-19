'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api';
import { branchStaffService } from '../../api/branch-staff.service';
import type { ActivoSede } from '../../types/branch-assets.types';
import type { EmpleadoSede } from '../../types/branch-staff.types';

interface AreaItem {
  id: number;
  nombre: string;
}

interface AssignAssetModalProps {
  activo: ActivoSede | null;
  sucursalId: number;
  onClose: () => void;
  onAsignarEmpleado: (id: string, empleadoId: string, fechaEsperada?: string | null, obs?: string | null) => Promise<any>;
  onAsignarArea: (id: string, areaId: number, fechaEsperada?: string | null, obs?: string | null) => Promise<any>;
}

export function AssignAssetModal({
  activo,
  sucursalId,
  onClose,
  onAsignarEmpleado,
  onAsignarArea,
}: AssignAssetModalProps) {
  const [tipoCustodia, setTipoCustodia] = useState<'empleado' | 'area'>('empleado');
  const [empleadoId, setEmpleadoId] = useState('');
  const [areaId, setAreaId] = useState<number | ''>('');
  const [fechaDevolucionEsperada, setFechaDevolucionEsperada] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [empleados, setEmpleados] = useState<EmpleadoSede[]>([]);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activo) return;
    setTipoCustodia('empleado');
    setEmpleadoId('');
    setAreaId('');
    setFechaDevolucionEsperada('');
    setObservaciones('');
    setError(null);

    let montado = true;

    // Cargar empleados de la sucursal
    branchStaffService.listarEmpleados(sucursalId, { isActive: true }).then((res) => {
      if (montado) setEmpleados(res);
    }).catch(() => {});

    // Cargar áreas de la sucursal
    apiClient.get<any>(`/administracion/sucursales/${sucursalId}/areas`).then((res) => {
      const items = Array.isArray(res) ? res : (res?.items || []);
      if (montado) {
        setAreas(items.map((a: any) => ({
          id: Number(a.id || a.id_area),
          nombre: String(a.nombre || ''),
        })));
      }
    }).catch(() => {});

    return () => {
      montado = false;
    };
  }, [activo, sucursalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activo) return;

    if (tipoCustodia === 'empleado' && !empleadoId) {
      setError('Debes seleccionar un colaborador para la asignación.');
      return;
    }
    if (tipoCustodia === 'area' && !areaId) {
      setError('Debes seleccionar un área para la asignación.');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const fechaEsp = fechaDevolucionEsperada.trim() ? fechaDevolucionEsperada.trim() : null;
      const obs = observaciones.trim() ? observaciones.trim() : null;

      if (tipoCustodia === 'empleado') {
        await onAsignarEmpleado(activo.id, empleadoId, fechaEsp, obs);
      } else {
        await onAsignarArea(activo.id, Number(areaId), fechaEsp, obs);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al asignar el activo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      open={Boolean(activo)}
      onClose={onClose}
      title="Asignar Custodia de Activo"
      description={`Asigna la custodia física del activo ${activo?.codigoActivo} (${activo?.nombre}).`}
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
            {guardando ? 'Asignando...' : 'Confirmar asignación'}
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

        {/* Selector de Tipo de Custodia (Colaborador vs Área) */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Tipo de custodio *
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-900/60 border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => setTipoCustodia('empleado')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                tipoCustodia === 'empleado'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Colaborador (Persona)
            </button>
            <button
              type="button"
              onClick={() => setTipoCustodia('area')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                tipoCustodia === 'area'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Área / Departamento
            </button>
          </div>
        </div>

        {/* Selector condicional */}
        {tipoCustodia === 'empleado' ? (
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Colaborador responsable *
            </label>
            <select
              required
              value={empleadoId}
              onChange={(e) => setEmpleadoId(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-100 focus:outline-none focus:border-white/30 cursor-pointer"
            >
              <option value="" className="bg-neutral-900 text-neutral-400">Seleccionar colaborador...</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id} className="bg-neutral-900 text-neutral-100">
                  {emp.nombre} {emp.cargo ? `(${emp.cargo})` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Área o departamento destino *
            </label>
            <select
              required
              value={areaId}
              onChange={(e) => setAreaId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-100 focus:outline-none focus:border-white/30 cursor-pointer"
            >
              <option value="" className="bg-neutral-900 text-neutral-400">Seleccionar área...</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id} className="bg-neutral-900 text-neutral-100">
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            Fecha esperada de devolución (opcional)
          </label>
          <input
            type="date"
            value={fechaDevolucionEsperada}
            onChange={(e) => setFechaDevolucionEsperada(e.target.value)}
            className="w-full px-3 py-2 font-mono bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-200 focus:outline-none focus:border-white/30 cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            Observaciones o estado inicial
          </label>
          <textarea
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej. Se entrega cargador original y funda de protección..."
            className="w-full px-3 py-2 bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-white/30 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
