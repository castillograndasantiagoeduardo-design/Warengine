'use client';

import React, { useState } from 'react';
import { Button3D } from '@/components/ui/Button3D';

interface Sucursal {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  isActive: boolean;
  totalUsuarios: number;
  totalProductos: number;
  ventasMes: number;
  areas: string[];
}

export default function SucursalesAdminPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([
    {
      id: 1,
      nombre: 'Sede Principal (Central)',
      direccion: 'Carrera 7 # 72-13, Torre Empresarial',
      telefono: '+57 (1) 745-8900',
      isActive: true,
      totalUsuarios: 8,
      totalProductos: 1420,
      ventasMes: 68500000,
      areas: ['Dirección General', 'Bodega Principal', 'Caja Mostrador', 'Servicio Técnico'],
    },
    {
      id: 2,
      nombre: 'Sucursal Norte - Distribución',
      direccion: 'Calle 170 # 15-42, Parque Industrial',
      telefono: '+57 (1) 682-1144',
      isActive: true,
      totalUsuarios: 4,
      totalProductos: 890,
      ventasMes: 38200000,
      areas: ['Almacén Despachos', 'Venta Mayorista'],
    },
    {
      id: 3,
      nombre: 'Sucursal Occidente - Retail POS',
      direccion: 'Avenida El Dorado # 68C-20, Local 104',
      telefono: '+57 (1) 410-9080',
      isActive: true,
      totalUsuarios: 3,
      totalProductos: 610,
      ventasMes: 21750000,
      areas: ['Punto de Venta', 'Mini Bodega'],
    },
    {
      id: 4,
      nombre: 'Sucursal Sur - En Expansión',
      direccion: 'Autopista Sur # 45-10',
      telefono: '+57 (1) 712-4000',
      isActive: false,
      totalUsuarios: 0,
      totalProductos: 0,
      ventasMes: 0,
      areas: ['Recepción'],
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<Sucursal | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
  });
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.direccion.trim() || !formData.telefono.trim()) {
      setErrorMsg('Todos los campos son obligatorios.');
      return;
    }

    // Verificar unicidad case-insensitive
    if (
      sucursales.some(
        (s) => s.nombre.toLowerCase().trim() === formData.nombre.toLowerCase().trim()
      )
    ) {
      setErrorMsg(`Ya existe una sucursal con el nombre "${formData.nombre}".`);
      return;
    }

    const nueva: Sucursal = {
      id: sucursales.length + 1,
      nombre: formData.nombre,
      direccion: formData.direccion,
      telefono: formData.telefono,
      isActive: true,
      totalUsuarios: 1,
      totalProductos: 0,
      ventasMes: 0,
      areas: ['Área Principal'],
    };

    setSucursales([...sucursales, nueva]);
    setFormData({ nombre: '', direccion: '', telefono: '' });
    setErrorMsg('');
    setModalOpen(false);
  };

  const toggleEstado = (sucursal: Sucursal) => {
    if (sucursal.id === 1) {
      alert('REGLA DE NEGOCIO (RF-ADM-C17):\nLa Sede Principal (id: 1) es inmutable para el sistema y no puede ser inactivada.');
      return;
    }

    if (sucursal.isActive && sucursal.totalUsuarios > 0) {
      alert(`REGLA DE NEGOCIO (RF-ADM-C17):\nNo se puede inactivar la sucursal porque tiene ${sucursal.totalUsuarios} usuario(s) activo(s) asignado(s). Reasigna a los empleados previamente.`);
      return;
    }

    setSucursales(
      sucursales.map((s) => (s.id === sucursal.id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 select-none">
      {/* Encabezado y Acción Crear */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#121d3d] to-[#0c1326] border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e3b341] font-[family-name:var(--font-pixelify)]">
              ESTRUCTURA FÍSICA Y SEDES (RF-ADM-C1 a C3, C17, C18)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 font-[family-name:var(--font-archivo)]">
            Gestión de Sucursales & Áreas Operativas
          </h2>
          <p className="text-xs text-white/60 mt-0.5 font-[family-name:var(--font-archivo)]">
            Control de puntos comerciales, distribución de áreas internas y estado operativo
          </p>
        </div>

        <Button3D onClick={() => setModalOpen(true)} className="text-xs py-2.5 px-4 self-start sm:self-auto">
          + Nueva Sucursal
        </Button3D>
      </div>

      {/* Grid de Sucursales */}
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
                      SEDE #{suc.id}
                    </span>
                    {suc.id === 1 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#e3b341]/20 text-[#e3b341] border border-[#e3b341]/30 font-[family-name:var(--font-pixelify)]">
                        PRINCIPAL (ID 1)
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
                  <span className="truncate">{suc.direccion}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/40">📞</span>
                  <span>{suc.telefono}</span>
                </div>
              </div>

              {/* Métricas Rápidas */}
              <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white/5">
                  <span className="text-[10px] text-white/40 block font-[family-name:var(--font-archivo)]">Personal</span>
                  <span className="font-[family-name:var(--font-anton)] text-sm text-white">
                    {suc.totalUsuarios} emp.
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/5">
                  <span className="text-[10px] text-white/40 block font-[family-name:var(--font-archivo)]">Catálogo</span>
                  <span className="font-[family-name:var(--font-anton)] text-sm text-white">
                    {suc.totalProductos} items
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/5">
                  <span className="text-[10px] text-white/40 block font-[family-name:var(--font-archivo)]">Ventas Mes</span>
                  <span className="font-[family-name:var(--font-anton)] text-sm text-[#e3b341]">
                    {formatCurrency(suc.ventasMes)}
                  </span>
                </div>
              </div>

              {/* Áreas Registradas */}
              <div className="mt-3">
                <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider font-[family-name:var(--font-archivo)]">
                  Áreas Operativas:
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {suc.areas.map((area, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/70 border border-white/10 font-[family-name:var(--font-archivo)]"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Botón de Ficha Detalle */}
            <div className="mt-5 pt-3 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setDetailModal(suc)}
                className="text-xs text-[#e3b341] hover:text-white transition-colors font-semibold flex items-center gap-1 cursor-pointer font-[family-name:var(--font-pixelify)]"
              >
                VER FICHA COMPLETA &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear Sucursal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0f1838] border border-white/20 rounded-2xl shadow-2xl p-6 select-none">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white font-[family-name:var(--font-archivo)]">
                Crear Nueva Sucursal (RF-ADM-C2)
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
                  placeholder="Ej: Sucursal Sur - Distribución"
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
                  placeholder="Ej: Autopista Norte # 120-45"
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
                  placeholder="Ej: +57 (1) 320-9988"
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
                  className="btn-3d text-xs py-2 px-5 font-bold"
                >
                  Registrar Sucursal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ficha Detallada (RF-ADM-C18) */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#0f1838] border border-white/20 rounded-2xl shadow-2xl p-6 select-none">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] text-[#e3b341] font-[family-name:var(--font-pixelify)]">
                  FICHA OFICIAL DE SUCURSAL
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
              <p><strong>Contacto Directo:</strong> {detailModal.telefono}</p>
              <p><strong>Estado Operativo:</strong> {detailModal.isActive ? '🟢 Operando con normalidad' : '🔴 Inactiva'}</p>
              <p><strong>Facturación Acumulada:</strong> <span className="text-[#e3b341] font-bold">{formatCurrency(detailModal.ventasMes)}</span></p>

              <div className="pt-2">
                <strong>Áreas Físicas Habilitadas:</strong>
                <ul className="list-disc list-inside mt-1 text-white/60 space-y-1">
                  {detailModal.areas.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
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
