'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { branchAssetsService } from '../../api/branch-assets.service';
import type { ActivoSede, CategoriaActivoSede, EditarActivoDTO } from '../../types/branch-assets.types';

interface EditAssetModalProps {
  activo: ActivoSede | null;
  onClose: () => void;
  onSubmit: (id: string, datos: EditarActivoDTO) => Promise<any>;
}

export function EditAssetModal({ activo, onClose, onSubmit }: EditAssetModalProps) {
  const [nombre, setNombre] = useState('');
  const [categoriaActivoId, setCategoriaActivoId] = useState<number | ''>('');
  const [valorAdquisicion, setValorAdquisicion] = useState<string>('');
  const [fechaAdquisicion, setFechaAdquisicion] = useState<string>('');
  const [condicion, setCondicion] = useState<string>('Bueno');

  const [categorias, setCategorias] = useState<CategoriaActivoSede[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activo) return;
    setNombre(activo.nombre || '');
    setCategoriaActivoId(activo.categoriaActivoId ?? '');
    setValorAdquisicion(activo.valorAdquisicion !== null && activo.valorAdquisicion !== undefined ? String(activo.valorAdquisicion) : '');
    setFechaAdquisicion(activo.fechaAdquisicion || '');
    setCondicion(activo.condicion || 'Bueno');
    setError(null);

    let montado = true;
    branchAssetsService.listarCategorias({ limit: 100, isActive: true }).then((res) => {
      if (montado) setCategorias(res.items);
    }).catch(() => {});

    return () => {
      montado = false;
    };
  }, [activo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activo) return;
    if (!nombre.trim()) {
      setError('El nombre del activo es obligatorio.');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const valNum = valorAdquisicion.trim() !== '' ? Number(valorAdquisicion) : null;
      await onSubmit(activo.id, {
        nombre: nombre.trim(),
        categoriaActivoId: categoriaActivoId !== '' ? Number(categoriaActivoId) : null,
        valorAdquisicion: valNum,
        fechaAdquisicion: fechaAdquisicion.trim() || null,
        condicion: condicion.trim() || null,
      });
      onClose();
    } catch (err: any) {
      const msg = err?.issues?.[0]?.message || err?.message || 'Error al actualizar el activo.';
      setError(msg);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      open={Boolean(activo)}
      onClose={onClose}
      title="Editar Activo"
      description={`Modifica la ficha técnica del activo ${activo?.codigoActivo || ''}.`}
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
            {guardando ? 'Guardando...' : 'Guardar cambios'}
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Código / Placa
            </label>
            <input
              type="text"
              disabled
              value={activo?.codigoActivo || ''}
              className="w-full px-3 py-2 font-mono bg-neutral-900/30 border border-white/5 rounded-xl text-sm text-neutral-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Categoría
            </label>
            <select
              value={categoriaActivoId}
              onChange={(e) => setCategoriaActivoId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-200 focus:outline-none focus:border-white/30 cursor-pointer"
            >
              <option value="" className="bg-neutral-900 text-neutral-200">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id} className="bg-neutral-900 text-neutral-200">
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            Nombre del activo *
          </label>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-white/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Valor de adquisición (COP)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={valorAdquisicion}
              onChange={(e) => setValorAdquisicion(e.target.value)}
              className="w-full px-3 py-2 font-mono bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Fecha de adquisición
            </label>
            <input
              type="date"
              value={fechaAdquisicion}
              onChange={(e) => setFechaAdquisicion(e.target.value)}
              className="w-full px-3 py-2 font-mono bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-200 focus:outline-none focus:border-white/30 cursor-pointer"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            Condición física
          </label>
          <select
            value={condicion}
            onChange={(e) => setCondicion(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-200 focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="Excelente" className="bg-neutral-900 text-neutral-200">Excelente</option>
            <option value="Bueno" className="bg-neutral-900 text-neutral-200">Bueno</option>
            <option value="Regular" className="bg-neutral-900 text-neutral-200">Regular</option>
            <option value="Desgastado" className="bg-neutral-900 text-neutral-200">Desgastado</option>
          </select>
        </div>
      </form>
    </Modal>
  );
}
