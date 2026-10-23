'use client';

import React, { useEffect, useState } from 'react';
import { Button3D } from '@/components/ui/Button3D';
import {
  fetchSucursales,
  crearSucursal,
  cambiarEstadoSucursal,
  fetchDetalleSucursal,
  SucursalResponse,
  SucursalDetalleResponse,
} from '@/features/administracion/api/sucursales.api';

export default function SucursalesAdminPage() {
  const [sucursales, setSucursales] = useState<SucursalResponse[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<SucursalDetalleResponse | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadSucursales() {
    setLoading(true);
    const res = await fetchSucursales();
    if (res.data) {
      setSucursales(res.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadSucursales();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.direccion.trim() || !formData.telefono.trim()) {
      setErrorMsg('Todos los campos son obligatorios.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const res = await crearSucursal({
      nombre: formData.nombre.trim(),
      direccion: formData.direccion.trim(),
      telefono: formData.telefono.trim(),
    });

    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }

    setFormData({ nombre: '', direccion: '', telefono: '' });
    setModalOpen(false);
    await loadSucursales();
    alert('¡Sucursal creada exitosamente en la base de datos!');
  };

  const toggleEstado = async (sucursal: SucursalResponse) => {
    if (sucursal.id === 1) {
      alert('REGLA DE NEGOCIO (RF-ADM-C17):\nLa Sede Principal (id: 1) es inmutable para el sistema y no puede ser inactivada.');
      return;
    }

    const nuevoEstado = !sucursal.isActive;
    const confirmMsg = nuevoEstado
      ? `¿Deseas reactivar la sucursal "${sucursal.nombre}"?`
      : `¿Deseas inactivar la sucursal "${sucursal.nombre}"? Recuerda que no debe tener usuarios activos asignados.`;

    if (!confirm(confirmMsg)) return;

    const res = await cambiarEstadoSucursal(sucursal.id, nuevoEstado);
    if (res.error) {
      alert(`No se pudo cambiar el estado: ${res.error}`);
      return;
    }

    await loadSucursales();
    alert(`Estado de "${sucursal.nombre}" actualizado a: ${nuevoEstado ? 'Activa' : 'Inactiva'}`);
  };

  const handleVerDetalle = async (id: number) => {
    const res = await fetchDetalleSucursal(id);
    if (res.data) {
      setDetailModal(res.data);
    } else {
      alert(res.error || 'No se pudo cargar la ficha de la sucursal.');
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 select-none">
      {/* Encabezado y Acción Crear */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#121d3d] to-[#0c1326] border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e3b341] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#e3b341] font-[family-name:var(--font-pixelify)]">
              TABLA `sucursales` CONECTADA A MYSQL
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 font-[family-name:var(--font-archivo)]">
            Gestión de Sucursales & Áreas Operativas
          </h2>
          <p className="text-xs text-white/60 mt-0.5 font-[family-name:var(--font-archivo)]">
            Control de puntos comerciales, validación de nombre único y regla de Sede Principal (id: 1)
          </p>
        </div>

        <Button3D onClick={() => setModalOpen(true)} className="text-xs py-2.5 px-4 self-start sm:self-auto">
          + Nueva Sucursal
        </Button3D>
      </div>

      {loading && (
        <div className="p-8 text-center text-xs font-[family-name:var(--font-pixelify)] text-[#e3b341] animate-pulse">
          Cargando sucursales desde base de datos...
        </div>
      )}

      {/* Grid de Sucursales de BD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sucursales.map((suc) => (
          <div
            key={suc.id}
            className={`p-5 rounded-2xl border transition-all duration-300 backdrop-blur-sm flex flex-col justify-between ${
              suc.isActive
                ? 'bg-[#0f1733]/90 border-white/10 hover:border-[#e3b341]/40 hover:shadow-[0_4px_24px_rgba(227,179,65,0.08)]'
                : 'bg-[#0a0f21]/80 border-white/5 opacity-60'
            }`}
          >
            <div>
              {/* Header de la Tarjeta */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-[family-name:var(--font-pixelify)] text-[#e3b341] font-bold">
                      ID #{suc.id}
                    </span>
                    {suc.id === 1 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#e3b341]/20 text-[#e3b341] border border-[#e3b341]/30 font-[family-name:var(--font-pixelify)]">
                        PRINCIPAL (INMUTABLE)
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase font-[family-name:var(--font-pixelify)] ${
                        suc.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {suc.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1 font-[family-name:var(--font-archivo)] truncate">
                    {suc.nombre}
                  </h3>
                </div>

                {/* Switch de Inactivación */}
                <button
                  onClick={() => toggleEstado(suc)}
                  title={suc.id === 1 ? 'Sede principal inmutable' : 'Cambiar estado'}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer font-[family-name:var(--font-pixelify)] shrink-0 ${
                    suc.isActive
                      ? 'bg-white/10 text-white/70 hover:bg-rose-500/20 hover:text-rose-400'
                      : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  }`}
                >
                  {suc.isActive ? 'Desactivar' : 'Activar'}
                </button>
              </div>

              {/* Información de Ubicación y Contacto */}
              <div className="mt-3 space-y-1.5 text-xs text-white/60 font-[family-name:var(--font-archivo)]">
                <div className="flex items-center gap-2">
                  <span className="text-white/40">📍</span>
                  <span className="truncate">{suc.direccion || 'Sin dirección registrada'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/40">📞</span>
                  <span>{suc.telefono || suc.contacto || 'Sin teléfono asignado'}</span>
                </div>
              </div>
            </div>

            {/* Botón de Ficha Detalle */}
            <div className="mt-5 pt-3 border-t border-white/5 flex justify-end">
              <button
                onClick={() => handleVerDetalle(suc.id)}
                className="text-xs text-[#e3b341] hover:text-white transition-colors font-semibold flex items-center gap-1 cursor-pointer font-[family-name:var(--font-pixelify)]"
              >
                VER FICHA CONSOLIDADA &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear Sucursal Conectado a POST /administracion/sucursales */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0f1838] border border-white/20 rounded-2xl shadow-2xl p-6 select-none">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white font-[family-name:var(--font-archivo)]">
                Crear Nueva Sucursal (POST /sucursales)
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-white/40 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-[family-name:var(--font-archivo)]">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1 font-[family-name:var(--font-archivo)]">
                  Nombre Comercial de la Sede
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sucursal Occidente"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#e3b341] transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1 font-[family-name:var(--font-archivo)]">
                  Dirección Física
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carrera 15 # 85-30"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#e3b341] transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1 font-[family-name:var(--font-archivo)]">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: +57 (1) 612-4455"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#e3b341] transition-all"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold cursor-pointer font-[family-name:var(--font-pixelify)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-3d text-xs py-2 px-5 font-bold disabled:opacity-50"
                >
                  {submitting ? 'Guardando en BD...' : 'Registrar en MySQL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ficha Detallada (GET /administracion/sucursales/:id/detalle) */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#0f1838] border border-white/20 rounded-2xl shadow-2xl p-6 select-none max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] text-[#e3b341] font-[family-name:var(--font-pixelify)]">
                  DATOS CONSOLIDADOS DE BD (RF-ADM-C18)
                </span>
                <h3 className="text-lg font-bold text-white font-[family-name:var(--font-archivo)]">
                  {detailModal.nombre}
                </h3>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="text-white/40 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-white/80 font-[family-name:var(--font-archivo)]">
              <p><strong>Ubicación:</strong> {detailModal.direccion}</p>
              <p><strong>Contacto:</strong> {detailModal.contacto || 'Sin contacto'}</p>
              <p><strong>Estado:</strong> {detailModal.isActive ? '🟢 Activa' : '🔴 Inactiva'}</p>
              
              {detailModal.estadisticas && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 grid grid-cols-2 gap-2 text-center my-3">
                  <div>
                    <span className="text-white/50 text-[10px] block">Productos en Stock</span>
                    <strong className="text-white text-sm font-[family-name:var(--font-anton)]">{detailModal.estadisticas.totalProductos}</strong>
                  </div>
                  <div>
                    <span className="text-white/50 text-[10px] block">Unidades Totales</span>
                    <strong className="text-[#e3b341] text-sm font-[family-name:var(--font-anton)]">{detailModal.estadisticas.unidadesStock} u.</strong>
                  </div>
                </div>
              )}

              {/* Personal Asignado */}
              <div className="pt-2">
                <strong>Personal Asignado a esta Sede:</strong>
                <div className="mt-1 space-y-1">
                  {detailModal.usuariosAsignados && detailModal.usuariosAsignados.length > 0 ? (
                    detailModal.usuariosAsignados.map((u) => (
                      <div key={u.id} className="p-2 rounded-lg bg-white/5 flex items-center justify-between text-[11px]">
                        <span>{u.nombre}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] uppercase font-[family-name:var(--font-pixelify)]">{u.rol}</span>
                          {u.esPrincipal && <span className="text-[9px] text-[#e3b341] font-bold">Sede Base</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/40 text-[11px]">No hay personal asignado a esta sede.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setDetailModal(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer font-[family-name:var(--font-pixelify)]"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
