'use client';

import React, { useEffect, useState } from 'react';
import { Button3D } from '@/components/ui/Button3D';
import {
  fetchUsuarios,
  crearUsuario,
  cambiarRolUsuario,
  cambiarEstadoUsuario,
  restablecerPasswordUsuario,
  UsuarioResponse,
} from '@/features/administracion/api/usuarios.api';
import { fetchSucursales, SucursalResponse } from '@/features/administracion/api/sucursales.api';

export default function UsuariosAdminPage() {
  const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([]);
  const [sucursales, setSucursales] = useState<SucursalResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRol, setFilterRol] = useState<string>('all');
  const [filterSucursal, setFilterSucursal] = useState<string>('all');
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    tipoDocumento: 'CC' as 'CC' | 'CE',
    numeroDocumento: '',
    email: '',
    password: '',
    rolId: 3, // cajero por defecto
    sucursalId: 1,
  });

  async function loadData() {
    setLoading(true);
    const [usrRes, sucRes] = await Promise.all([
      fetchUsuarios(),
      fetchSucursales(),
    ]);

    if (usrRes.data) {
      setUsuarios(usrRes.data);
    }
    if (sucRes.data) {
      setSucursales(sucRes.data);
      if (sucRes.data.length > 0 && !form.sucursalId) {
        setForm((f) => ({ ...f, sucursalId: sucRes.data![0].id }));
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = usuarios.filter((u) => {
    const fullName = `${u.nombre} ${u.apellido || ''}`.toLowerCase();
    const matchQuery =
      fullName.includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    const matchRol = filterRol === 'all' || String(u.rolId) === filterRol;
    const matchSuc = filterSucursal === 'all' || String(u.sucursalId) === filterSucursal;

    return matchQuery && matchRol && matchSuc;
  });

  const handleCreateUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const res = await crearUsuario({
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      tipoDocumento: form.tipoDocumento,
      numeroDocumento: form.numeroDocumento.trim(),
      email: form.email.trim(),
      password: form.password,
      rolId: Number(form.rolId),
      sucursalId: Number(form.sucursalId),
    });

    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }

    setModalCreateOpen(false);
    setForm({
      nombre: '',
      apellido: '',
      tipoDocumento: 'CC',
      numeroDocumento: '',
      email: '',
      password: '',
      rolId: 3,
      sucursalId: sucursales[0]?.id || 1,
    });
    await loadData();
    alert('¡Empleado y usuario creados atómicamente en la base de datos!');
  };

  const handleCambiarEstado = async (user: UsuarioResponse) => {
    const nuevoEstado = !user.isActive;
    const res = await cambiarEstadoUsuario(user.id, nuevoEstado);
    if (res.error) {
      alert(`No se pudo actualizar estado: ${res.error}`);
      return;
    }

    await loadData();
    alert(`Estado de ${user.nombre} actualizado a: ${nuevoEstado ? 'Activo' : 'Inactivo'}`);
  };

  const handleCambiarRol = async (user: UsuarioResponse) => {
    const opciones = [
      { id: 1, label: '1 - Super Admin' },
      { id: 2, label: '2 - Admin Sucursal' },
      { id: 3, label: '3 - Cajero POS' },
      { id: 4, label: '4 - Vendedor B2B' },
    ];

    const input = prompt(
      `Selecciona el nuevo rol para ${user.nombre}:\n${opciones.map((o) => o.label).join('\n')}\nIngresa el número (1 a 4):`,
      String(user.rolId)
    );

    if (!input) return;
    const rolId = parseInt(input, 10);
    if (isNaN(rolId) || rolId < 1 || rolId > 4) {
      alert('Número de rol inválido.');
      return;
    }

    const res = await cambiarRolUsuario(user.id, rolId);
    if (res.error) {
      alert(`Error al cambiar rol: ${res.error}`);
      return;
    }

    await loadData();
    alert('Rol actualizado con éxito en la base de datos. Tokens de sesión invalidados.');
  };

  const handleRestablecerPassword = async (user: UsuarioResponse) => {
    const nueva = prompt(`Ingresa la nueva contraseña para ${user.email} (mínimo 8 caracteres):`);
    if (!nueva) return;
    if (nueva.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    const res = await restablecerPasswordUsuario(user.id, nueva);
    if (res.error) {
      alert(`Error al restablecer contraseña: ${res.error}`);
      return;
    }

    alert(`Contraseña actualizada con hash Argon2id en BD. Sesiones previas revocadas.`);
  };

  const getRolBadge = (rolNombre: string) => {
    switch (rolNombre) {
      case 'super-admin':
        return 'bg-[#e3b341]/20 text-[#e3b341] border-[#e3b341]/30';
      case 'admin-sucursal':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      case 'cajero':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'vendedor-b2b':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-white/10 text-white/70 border-white/20';
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#121d3d] to-[#0c1326] border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e3b341] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#e3b341] font-[family-name:var(--font-pixelify)]">
              TABLAS `usuarios` Y `empleados` EN MYSQL
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 font-[family-name:var(--font-archivo)]">
            Gestión de Cuentas, Permisos & Asignación Multisede
          </h2>
          <p className="text-xs text-white/60 mt-0.5 font-[family-name:var(--font-archivo)]">
            Transacciones atómicas, hashing Argon2id y revocación en tiempo real de tokens JWT
          </p>
        </div>

        <Button3D onClick={() => setModalCreateOpen(true)} className="text-xs py-2.5 px-4 self-start sm:self-auto">
          + Nuevo Usuario
        </Button3D>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 rounded-2xl bg-[#0f1733]/90 border border-white/10 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between backdrop-blur-sm">
        {/* Buscador */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por nombre o correo electrónico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-[#e3b341] transition-all font-[family-name:var(--font-archivo)]"
          />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
            🔍
          </div>
        </div>

        {/* Filtros Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro por Rol */}
          <select
            value={filterRol}
            onChange={(e) => setFilterRol(e.target.value)}
            className="bg-[#121c3b] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-[#e3b341] font-[family-name:var(--font-archivo)] cursor-pointer"
          >
            <option value="all">Todos los Roles</option>
            <option value="1">Super Admin (ID 1)</option>
            <option value="2">Admin Sucursal (ID 2)</option>
            <option value="3">Cajero POS (ID 3)</option>
            <option value="4">Vendedor B2B (ID 4)</option>
          </select>

          {/* Filtro por Sucursal */}
          <select
            value={filterSucursal}
            onChange={(e) => setFilterSucursal(e.target.value)}
            className="bg-[#121c3b] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-[#e3b341] font-[family-name:var(--font-archivo)] cursor-pointer"
          >
            <option value="all">Todas las Sedes</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-xs font-[family-name:var(--font-pixelify)] text-[#e3b341] animate-pulse">
          Consultando registros de personal en MySQL...
        </div>
      )}

      {/* Tabla de Usuarios de la BD */}
      <div className="rounded-2xl bg-[#0f1733]/90 border border-white/10 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-[family-name:var(--font-archivo)]">
            <thead className="bg-[#0b1228] text-white/50 text-[10px] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="p-4">Empleado / Nombre</th>
                <th className="p-4">Correo Institucional</th>
                <th className="p-4">Rol Asignado</th>
                <th className="p-4">Sede Base</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones de Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-white text-sm">
                      {user.nombre} {user.apellido || ''}
                    </div>
                    <div className="text-[10px] font-mono text-white/40 mt-0.5">
                      UUID: {user.id.slice(0, 8)}...
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="text-white/80 font-mono text-[11px]">{user.email}</span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border font-[family-name:var(--font-pixelify)] ${getRolBadge(
                        user.rolNombre
                      )}`}
                    >
                      {user.rolNombre}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="font-semibold text-white/90">
                      🏢 {user.sucursalNombre || `Sucursal #${user.sucursalId}`}
                    </div>
                  </td>

                  <td className="p-4">
                    <button
                      onClick={() => handleCambiarEstado(user)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer font-[family-name:var(--font-pixelify)] ${
                        user.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-rose-500/20 hover:text-rose-400'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-emerald-500/20 hover:text-emerald-400'
                      }`}
                    >
                      {user.isActive ? 'Activo ✓' : 'Inactivo ✕'}
                    </button>
                  </td>

                  <td className="p-4 text-right space-x-2">
                    {/* Cambiar Rol */}
                    <button
                      onClick={() => handleCambiarRol(user)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-[11px] transition-colors cursor-pointer border border-white/10"
                      title="Cambiar Rol (PUT /usuarios/:id/rol)"
                    >
                      Rol ⚙️
                    </button>

                    {/* Reset Password */}
                    <button
                      onClick={() => handleRestablecerPassword(user)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-[#e3b341] text-[11px] transition-colors cursor-pointer border border-[#e3b341]/20 font-[family-name:var(--font-pixelify)]"
                      title="Restablecer Clave (PUT /usuarios/:id/password)"
                    >
                      Clave 🔑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer de la Tabla */}
        <div className="p-4 border-t border-white/5 text-xs text-white/40 flex items-center justify-between font-[family-name:var(--font-archivo)]">
          <span>Mostrando {filteredUsers.length} cuentas desde MySQL</span>
          <span className="text-[#e3b341] font-[family-name:var(--font-pixelify)]">
            TRANSACCIONALIDAD PURA
          </span>
        </div>
      </div>

      {/* Modal Crear Usuario + Empleado Atómico Conectado a POST /administracion/usuarios */}
      {modalCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#0f1838] border border-white/20 rounded-2xl shadow-2xl p-6 select-none max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] text-[#e3b341] font-[family-name:var(--font-pixelify)]">
                  TRANSACCIÓN ATÓMICA (POST /usuarios)
                </span>
                <h3 className="text-base font-bold text-white font-[family-name:var(--font-archivo)]">
                  Crear Empleado y Cuenta en MySQL
                </h3>
              </div>
              <button
                onClick={() => setModalCreateOpen(false)}
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

            <form onSubmit={handleCreateUsuario} className="mt-4 space-y-3.5 text-xs font-[family-name:var(--font-archivo)]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/70 block mb-1">Nombre</label>
                  <input
                    required
                    placeholder="Ej: Laura"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white"
                  />
                </div>
                <div>
                  <label className="text-white/70 block mb-1">Apellido</label>
                  <input
                    required
                    placeholder="Ej: Silva"
                    value={form.apellido}
                    onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-white/70 block mb-1">Tipo Doc.</label>
                  <select
                    value={form.tipoDocumento}
                    onChange={(e) => setForm({ ...form, tipoDocumento: e.target.value as 'CC' | 'CE' })}
                    className="w-full px-3 py-2 rounded-xl bg-[#121c3b] border border-white/15 text-white"
                  >
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-white/70 block mb-1">Número de Documento</label>
                  <input
                    required
                    placeholder="Ej: 1056789020"
                    value={form.numeroDocumento}
                    onChange={(e) => setForm({ ...form, numeroDocumento: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/70 block mb-1">Correo Institucional</label>
                <input
                  required
                  type="email"
                  placeholder="laura.silva@warengine.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white"
                />
              </div>

              <div>
                <label className="text-white/70 block mb-1">Contraseña Inicial (Argon2id)</label>
                <input
                  required
                  minLength={8}
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/70 block mb-1">Rol en el Sistema</label>
                  <select
                    value={form.rolId}
                    onChange={(e) => setForm({ ...form, rolId: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#121c3b] border border-white/15 text-white"
                  >
                    <option value={3}>Cajero POS</option>
                    <option value={2}>Admin Sucursal</option>
                    <option value={4}>Vendedor B2B</option>
                    <option value={1}>Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/70 block mb-1">Sucursal Base</label>
                  <select
                    value={form.sucursalId}
                    onChange={(e) => setForm({ ...form, sucursalId: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#121c3b] border border-white/15 text-white"
                  >
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold cursor-pointer font-[family-name:var(--font-pixelify)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-3d text-xs py-2 px-5 font-bold disabled:opacity-50"
                >
                  {submitting ? 'Creando...' : 'Crear en Base de Datos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
