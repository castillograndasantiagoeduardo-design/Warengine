'use client';

/**
 * /admin-sucursal/inventario/proveedores — Directorio de Proveedores comerciales.
 * Rediseñado con estructura estándar (.vidrio, tabla semántica, badges, modals).
 */

import React, { useState, useEffect } from 'react';
import { branchInventoryService } from '@/features/admin-sucursal/api/branch-inventory.service';
import {
  CreateSupplierModal,
  EditSupplierModal,
} from '@/features/admin-sucursal';
import { Pagination } from '@/features/admin-sucursal/components/shared/Pagination';
import { LoadingState, EmptyState } from '@/features/admin-sucursal/components/shared/States';
import type { ProveedorInventario } from '@/features/admin-sucursal/types/branch-inventory.types';

export default function AdminSucursalInventarioProveedoresPage() {
  const [proveedores, setProveedores] = useState<ProveedorInventario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activo' | 'inactivo'>('todos');
  const [page, setPage] = useState(1);
  const limit = 15;

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<ProveedorInventario | null>(null);

  const cargarProveedores = async () => {
    setIsLoading(true);
    try {
      const filtros: { busqueda?: string; isActive?: boolean } = {};
      if (busqueda.trim()) filtros.busqueda = busqueda.trim();
      if (filtroEstado === 'activo') filtros.isActive = true;
      if (filtroEstado === 'inactivo') filtros.isActive = false;

      const data = await branchInventoryService.listarProveedores(filtros);
      setProveedores(data);
    } catch {
      setProveedores([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, [busqueda, filtroEstado]);

  const handleToggleEstado = async (prov: ProveedorInventario) => {
    const nuevoEstado = !prov.isActive;
    try {
      await branchInventoryService.cambiarEstadoProveedor(prov.id, nuevoEstado);
      setProveedores((prev) =>
        prev.map((p) => (p.id === prov.id ? { ...p, isActive: nuevoEstado } : p)),
      );
    } catch (err: any) {
      alert(err?.message || 'Error al actualizar estado del proveedor.');
    }
  };

  const total = proveedores.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = (page - 1) * limit;
  const itemsPaginados = proveedores.slice(startIndex, startIndex + limit);

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Acción */}
      <div className="vidrio rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row gap-2.5 items-center">
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Buscar por nombre o contacto..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3.5 pl-9 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 text-xs focus:outline-none focus:border-rose-500"
            />
            <svg
              className="w-4 h-4 absolute left-3 top-3 text-white/40 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <select
            value={filtroEstado}
            onChange={(e) => {
              setFiltroEstado(e.target.value as any);
              setPage(1);
            }}
            aria-label="Filtrar por estado"
            className="h-10 w-full sm:w-auto px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Solo activos</option>
            <option value="inactivo">Solo inactivos</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="h-10 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
        >
          <span>+</span>
          <span>Nuevo Proveedor</span>
        </button>
      </div>

      {/* Tabla de Proveedores */}
      <div className="vidrio rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <LoadingState rows={6} />
          </div>
        ) : proveedores.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No hay proveedores encontrados"
              description="No se hallaron proveedores registrados con los criterios de búsqueda actuales."
              action={
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Registrar primer proveedor
                </button>
              }
            />
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-white/50 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Razón Social / Proveedor</th>
                    <th className="py-3 px-4">Contacto / Teléfono / Asesor</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {itemsPaginados.map((p) => {
                    const isActive = p.isActive ?? true;
                    return (
                      <tr key={p.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">
                            {p.nombre}
                          </div>
                          <div className="text-[11px] font-mono text-white/40">
                            ID #{p.id}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white/70">
                          {p.contacto || (
                            <span className="text-white/30 italic">Sin datos de contacto</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                : 'bg-white/5 text-white/40 border-white/10'
                            }`}
                          >
                            {isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setProveedorSeleccionado(p);
                                setEditModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/5 text-white/80 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleEstado(p)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {isActive ? 'Inactivar' : 'Activar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {total > limit && (
              <div className="p-4 border-t border-white/[0.08]">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      <CreateSupplierModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onProveedorCreado={() => {
          cargarProveedores();
        }}
        crearProveedorFn={async (dto) => {
          try {
            const data = await branchInventoryService.crearProveedor(dto);
            return { ok: true, data };
          } catch (err: any) {
            return { ok: false, error: err?.message };
          }
        }}
      />

      <EditSupplierModal
        isOpen={editModalOpen}
        proveedor={proveedorSeleccionado}
        onClose={() => setEditModalOpen(false)}
        onProveedorActualizado={() => {
          cargarProveedores();
        }}
        actualizarProveedorFn={async (id, dto) => {
          try {
            await branchInventoryService.editarProveedor(id, dto);
            return { ok: true };
          } catch (err: any) {
            return { ok: false, error: err?.message };
          }
        }}
      />
    </div>
  );
}
