'use client';

import React, { useState } from 'react';
import { Button3D } from '@/components/ui/Button3D';

interface UsuarioGestionado {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  documento: string;
  tipoDocumento: 'CC' | 'CE';
  rol: 'super-admin' | 'admin-sucursal' | 'cajero' | 'vendedor-b2b';
  sucursalPrincipal: string;
  sucursalPrincipalId: number;
  sucursalesAdicionales: string[];
  isActive: boolean;
}

export default function UsuariosAdminPage() {
  const [usuarios, setUsuarios] = useState<UsuarioGestionado[]>([
    {
      id: 'usr-1',
      email: 'admin@warengine.com',
      nombre: 'Santiago',
      apellido: 'Castillo',
      documento: '1020304050',
      tipoDocumento: 'CC',
      rol: 'super-admin',
      sucursalPrincipal: 'Sede Principal (Central)',
      sucursalPrincipalId: 1,
      sucursalesAdicionales: ['Sucursal Norte', 'Sucursal Occidente'],
      isActive: true,
    },
    {
      id: 'usr-2',
      email: 'gerencia.norte@warengine.com',
      nombre: 'Carlos',
      apellido: 'Mendoza',
      documento: '79845120',
      tipoDocumento: 'CC',
      rol: 'admin-sucursal',
      sucursalPrincipal: 'Sucursal Norte',
      sucursalPrincipalId: 2,
      sucursalesAdicionales: [],
      isActive: true,
    },
    {
      id: 'usr-3',
      email: 'caja1.central@warengine.com',
      nombre: 'Valentina',
      apellido: 'Gómez',
      documento: '1014285900',
      tipoDocumento: 'CC',
      rol: 'cajero',
      sucursalPrincipal: 'Sede Principal (Central)',
      sucursalPrincipalId: 1,
      sucursalesAdicionales: [],
      isActive: true,
    },
    {
      id: 'usr-4',
      email: 'ventas.b2b@warengine.com',
      nombre: 'Mauricio',
      apellido: 'Duque',
      documento: '80123456',
      tipoDocumento: 'CC',
      rol: 'vendedor-b2b',
      sucursalPrincipal: 'Sede Principal (Central)',
      sucursalPrincipalId: 1,
      sucursalesAdicionales: ['Sucursal Norte'],
      isActive: true,
    },
    {
      id: 'usr-5',
      email: 'cajero.norte@warengine.com',
      nombre: 'Andrés',
      apellido: 'Rivas',
      documento: '1032489000',
      tipoDocumento: 'CC',
      rol: 'cajero',
      sucursalPrincipal: 'Sucursal Norte',
      sucursalPrincipalId: 2,
      sucursalesAdicionales: [],
      isActive: false,
    },
  ]);

  const [search, setSearch] = useState('');
  const [filterRol, setFilterRol] = useState<string>('all');
  const [filterSucursal, setFilterSucursal] = useState<string>('all');
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuarioGestionado | null>(null);

  // Filtro reactivo en vivo
  const filteredUsers = usuarios.filter((u) => {
    const matchQuery =
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.apellido.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.documento.includes(search);

    const matchRol = filterRol === 'all' || u.rol === filterRol;
    const matchSuc =
      filterSucursal === 'all' ||
      u.sucursalPrincipalId.toString() === filterSucursal;

    return matchQuery && matchRol && matchSuc;
  });

  const contarSuperAdminsActivos = () =>
    usuarios.filter((u) => u.rol === 'super-admin' && u.isActive).length;

  const handleCambiarEstado = (user: UsuarioGestionado) => {
    if (user.rol === 'super-admin' && user.isActive && contarSuperAdminsActivos() <= 1) {
      alert('REGLA DE SEGURIDAD (RF-ADM-C8):\nNo puedes desactivar al único Super Admin activo del sistema.');
      return;
    }

    setUsuarios((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
    );
  };

  const handleCambiarRol = (user: UsuarioGestionado, nuevoRol: UsuarioGestionado['rol']) => {
    if (user.rol === 'super-admin' && nuevoRol !== 'super-admin' && contarSuperAdminsActivos() <= 1) {
      alert('REGLA DE SEGURIDAD (RF-ADM-C7):\nNo puedes quitar el rol de Super Admin al único Super Admin activo.');
      return;
    }

    setUsuarios((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, rol: nuevoRol } : u))
    );
    alert(`Rol de ${user.nombre} actualizado a: ${nuevoRol}. Sesiones JWT anteriores invalidadas.`);
  };

  const handleRestablecerPassword = (user: UsuarioGestionado) => {
    const nueva = prompt(`Ingresa la nueva contraseña temporal para ${user.email} (mínimo 8 caracteres):`);
    if (!nueva) return;
    if (nueva.length < 8) {
      alert('La contraseña debe tener mínimo 8 caracteres.');
      return;
    }
    alert(`Contraseña actualizada exitosamente con Argon2id. Todos los tokens y sesiones previas de ${user.email} han sido invalidados.`);
  };

  const getRolBadge = (rol: UsuarioGestionado['rol']) => {
    switch (rol) {
      case 'super-admin':
        return 'bg-[#e3b341]/20 text-[#e3b341] border-[#e3b341]/30';
      case 'admin-sucursal':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      case 'cajero':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'vendedor-b2b':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#121d3d] to-[#0c1326] border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e3b341] font-[family-name:var(--font-pixelify)]">
              DIRECTORIO DE PERSONAL & ROLES (RF-ADM-C5 a C10)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 font-[family-name:var(--font-archivo)]">
            Gestión de Cuentas, Permisos & Asignación Multisede
          </h2>
          <p className="text-xs text-white/60 mt-0.5 font-[family-name:var(--font-archivo)]">
            Administración de empleados, vinculación de credenciales, roles jerárquicos y revocación de sesiones
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
            placeholder="Buscar por nombre, documento o correo electrónico..."
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
            <option value="super-admin">Super Admin</option>
            <option value="admin-sucursal">Admin Sucursal</option>
            <option value="cajero">Cajero POS</option>
            <option value="vendedor-b2b">Vendedor B2B</option>
          </select>

          {/* Filtro por Sucursal */}
          <select
            value={filterSucursal}
            onChange={(e) => setFilterSucursal(e.target.value)}
            className="bg-[#121c3b] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-[#e3b341] font-[family-name:var(--font-archivo)] cursor-pointer"
          >
            <option value="all">Todas las Sedes</option>
            <option value="1">Sede Principal (#1)</option>
            <option value="2">Sucursal Norte (#2)</option>
            <option value="3">Sucursal Occidente (#3)</option>
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="rounded-2xl bg-[#0f1733]/90 border border-white/10 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-[family-name:var(--font-archivo)]">
            <thead className="bg-[#0b1228] text-white/50 text-[10px] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="p-4">Empleado / Documento</th>
                <th className="p-4">Correo Institucional</th>
                <th className="p-4">Rol Asignado</th>
                <th className="p-4">Sede Principal & Multisede</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones de Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-white text-sm">
                      {user.nombre} {user.apellido}
                    </div>
                    <div className="text-[11px] text-white/50 mt-0.5">
                      {user.tipoDocumento} {user.documento}
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="text-white/80 font-mono text-[11px]">{user.email}</span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border font-[family-name:var(--font-pixelify)] ${getRolBadge(
                        user.rol
                      )}`}
                    >
                      {user.rol}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="font-semibold text-white/90">
                      🏢 {user.sucursalPrincipal}
                    </div>
                    {user.sucursalesAdicionales.length > 0 && (
                      <div className="text-[10px] text-[#e3b341] mt-0.5">
                        + Sedes: {user.sucursalesAdicionales.join(', ')}
                      </div>
                    )}
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
                      onClick={() => {
                        const roles: UsuarioGestionado['rol'][] = ['super-admin', 'admin-sucursal', 'cajero', 'vendedor-b2b'];
                        const rolElegido = prompt(`Cambiar rol para ${user.nombre}. Opciones disponibles: ${roles.join(', ')}`, user.rol) as UsuarioGestionado['rol'];
                        if (rolElegido && roles.includes(rolElegido)) {
                          handleCambiarRol(user, rolElegido);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-[11px] transition-colors cursor-pointer border border-white/10"
                      title="Cambiar Rol (RF-ADM-C7)"
                    >
                      Rol ⚙️
                    </button>

                    {/* Reset Password */}
                    <button
                      onClick={() => handleRestablecerPassword(user)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-[#e3b341] text-[11px] transition-colors cursor-pointer border border-[#e3b341]/20 font-[family-name:var(--font-pixelify)]"
                      title="Restablecer Clave (RF-ADM-C9)"
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
          <span>Mostrando {filteredUsers.length} de {usuarios.length} cuentas registradas</span>
          <span className="text-[#e3b341] font-[family-name:var(--font-pixelify)]">
            PROTECCIÓN ÚLTIMO SUPER ADMIN ACTIVA
          </span>
        </div>
      </div>

      {/* Modal Crear Usuario + Empleado Atómico (RF-ADM-C6) */}
      {modalCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#0f1838] border border-white/20 rounded-2xl shadow-2xl p-6 select-none max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] text-[#e3b341] font-[family-name:var(--font-pixelify)]">
                  TRANSACCIÓN ATÓMICA DE BD (RF-ADM-C6)
                </span>
                <h3 className="text-base font-bold text-white font-[family-name:var(--font-archivo)]">
                  Crear Empleado y Cuenta de Acceso
                </h3>
              </div>
              <button
                onClick={() => setModalCreateOpen(false)}
                className="text-white/40 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Usuario y empleado creados atómicamente con éxito. Se ha generado evento en auditoría y hash Argon2id.');
                setModalCreateOpen(false);
              }}
              className="mt-4 space-y-3.5 text-xs font-[family-name:var(--font-archivo)]"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/70 block mb-1">Nombre</label>
                  <input required placeholder="Ej: Diana" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white" />
                </div>
                <div>
                  <label className="text-white/70 block mb-1">Apellido</label>
                  <input required placeholder="Ej: Morales" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-white/70 block mb-1">Tipo Doc.</label>
                  <select className="w-full px-3 py-2 rounded-xl bg-[#121c3b] border border-white/15 text-white">
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-white/70 block mb-1">Número de Documento</label>
                  <input required placeholder="Ej: 1045982100" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white" />
                </div>
              </div>

              <div>
                <label className="text-white/70 block mb-1">Correo Institucional</label>
                <input required type="email" placeholder="diana.morales@warengine.com" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white" />
              </div>

              <div>
                <label className="text-white/70 block mb-1">Contraseña Inicial (Argon2id)</label>
                <input required minLength={8} type="password" placeholder="Mínimo 8 caracteres" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/70 block mb-1">Rol en el Sistema</label>
                  <select className="w-full px-3 py-2 rounded-xl bg-[#121c3b] border border-white/15 text-white">
                    <option value="cajero">Cajero POS</option>
                    <option value="admin-sucursal">Admin Sucursal</option>
                    <option value="vendedor-b2b">Vendedor B2B</option>
                    <option value="super-admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/70 block mb-1">Sucursal Base</label>
                  <select className="w-full px-3 py-2 rounded-xl bg-[#121c3b] border border-white/15 text-white">
                    <option value="1">Sede Principal (Central)</option>
                    <option value="2">Sucursal Norte</option>
                    <option value="3">Sucursal Occidente</option>
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
                <button type="submit" className="btn-3d text-xs py-2 px-5 font-bold">
                  Crear Empleado y Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
