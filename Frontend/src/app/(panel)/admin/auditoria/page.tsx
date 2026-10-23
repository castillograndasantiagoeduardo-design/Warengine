'use client';

import React, { useState } from 'react';
import { Button3D } from '@/components/ui/Button3D';

interface AuditLog {
  id: number;
  fecha: string;
  usuario: string;
  rol: string;
  accion: 'crear' | 'editar' | 'inactivar' | 'cambiar_rol' | 'login' | 'acceso_denegado';
  entidad: string;
  ip: string;
  detalles: {
    antes?: Record<string, unknown>;
    despues?: Record<string, unknown>;
    motivo?: string;
  };
}

export default function AuditoriaAdminPage() {
  const [logs] = useState<AuditLog[]>([
    {
      id: 1042,
      fecha: '2026-10-22 19:42:15',
      usuario: 'admin@warengine.com',
      rol: 'super-admin',
      accion: 'cambiar_rol',
      entidad: 'usuarios',
      ip: '190.14.33.112',
      detalles: {
        antes: { usuarioId: 'usr-4', rolId: 3, rolNombre: 'cajero' },
        despues: { usuarioId: 'usr-4', rolId: 4, rolNombre: 'vendedor-b2b' },
      },
    },
    {
      id: 1041,
      fecha: '2026-10-22 18:25:00',
      usuario: 'admin@warengine.com',
      rol: 'super-admin',
      accion: 'crear',
      entidad: 'sucursales',
      ip: '190.14.33.112',
      detalles: {
        despues: {
          id: 3,
          nombre: 'Sucursal Occidente - Retail POS',
          direccion: 'Avenida El Dorado # 68C-20',
          isActive: true,
        },
      },
    },
    {
      id: 1040,
      fecha: '2026-10-22 17:10:44',
      usuario: 'caja1.central@warengine.com',
      rol: 'cajero',
      accion: 'login',
      entidad: 'sesiones',
      ip: '186.84.10.9',
      detalles: {
        despues: { metodo: 'password_argon2id', '2fa': 'totp_omitido' },
      },
    },
    {
      id: 1039,
      fecha: '2026-10-22 16:04:12',
      usuario: 'desconocido@externo.com',
      rol: 'anonimo',
      accion: 'acceso_denegado',
      entidad: 'autenticacion',
      ip: '45.132.22.1',
      detalles: {
        motivo: 'Credenciales inválidas (3er intento)',
      },
    },
    {
      id: 1038,
      fecha: '2026-10-22 14:15:30',
      usuario: 'admin@warengine.com',
      rol: 'super-admin',
      accion: 'editar',
      entidad: 'usuarios',
      ip: '190.14.33.112',
      detalles: {
        despues: { credenciales: 'restablecidas', sesionesRevocadas: true },
      },
    },
  ]);

  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [filterAccion, setFilterAccion] = useState('all');

  const filteredLogs = logs.filter(
    (l) => filterAccion === 'all' || l.accion === filterAccion
  );

  const exportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      'ID,Fecha,Usuario,Rol,Acción,Entidad,IP,Detalles\n' +
      logs
        .map(
          (l) =>
            `${l.id},"${l.fecha}","${l.usuario}","${l.rol}","${l.accion}","${l.entidad}","${l.ip}","${JSON.stringify(
              l.detalles
            ).replace(/"/g, '""')}"`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_warengine_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (accion: AuditLog['accion']) => {
    switch (accion) {
      case 'crear':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'editar':
      case 'cambiar_rol':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      case 'inactivar':
      case 'acceso_denegado':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'login':
        return 'bg-[#e3b341]/20 text-[#e3b341] border-[#e3b341]/30';
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#121d3d] to-[#0c1326] border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e3b341] font-[family-name:var(--font-pixelify)]">
              BITÁCORA INMUTABLE (RF-ADM-C11, C19, C20)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 font-[family-name:var(--font-archivo)]">
            Auditoría de Eventos & Seguridad del Sistema
          </h2>
          <p className="text-xs text-white/60 mt-0.5 font-[family-name:var(--font-archivo)]">
            Registro append-only protegido por triggers de BD (sin mutaciones ni eliminaciones permitidas)
          </p>
        </div>

        <Button3D onClick={exportCsv} className="text-xs py-2.5 px-4 self-start sm:self-auto">
          📥 Exportar Bitácora CSV
        </Button3D>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 rounded-2xl bg-[#0f1733]/90 border border-white/10 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/60 font-[family-name:var(--font-archivo)]">
            Filtrar por tipo de evento:
          </span>
          <select
            value={filterAccion}
            onChange={(e) => setFilterAccion(e.target.value)}
            className="bg-[#121c3b] text-white text-xs px-3.5 py-2 rounded-xl border border-white/15 focus:outline-none focus:border-[#e3b341] font-[family-name:var(--font-archivo)] cursor-pointer"
          >
            <option value="all">Todas las Acciones</option>
            <option value="crear">Creación de Registros</option>
            <option value="editar">Edición / Modificaciones</option>
            <option value="cambiar_rol">Cambio de Roles</option>
            <option value="login">Inicios de Sesión</option>
            <option value="acceso_denegado">Accesos Bloqueados</option>
          </select>
        </div>

        <div className="text-xs text-white/40 font-[family-name:var(--font-pixelify)] hidden sm:block">
          TRIGGERS MYSQL: UPDATE/DELETE LOCKED
        </div>
      </div>

      {/* Tabla de Registros */}
      <div className="rounded-2xl bg-[#0f1733]/90 border border-white/10 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-[family-name:var(--font-archivo)]">
            <thead className="bg-[#0b1228] text-white/50 text-[10px] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="p-4">Evento / ID</th>
                <th className="p-4">Fecha & Hora</th>
                <th className="p-4">Usuario Responsable</th>
                <th className="p-4">Acción</th>
                <th className="p-4">Entidad Afectada</th>
                <th className="p-4">IP Origen</th>
                <th className="p-4 text-right">Diferencias (Diff)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLog === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <span className="font-mono text-[#e3b341] font-bold">#{log.id}</span>
                      </td>

                      <td className="p-4 text-white/70 font-mono text-[11px]">
                        {log.fecha}
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-white">{log.usuario}</div>
                        <div className="text-[10px] text-white/40 font-[family-name:var(--font-pixelify)]">
                          {log.rol}
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border font-[family-name:var(--font-pixelify)] ${getActionBadge(
                            log.accion
                          )}`}
                        >
                          {log.accion}
                        </span>
                      </td>

                      <td className="p-4 text-white/80 font-mono text-[11px]">
                        {log.entidad}
                      </td>

                      <td className="p-4 text-white/50 font-mono text-[11px]">
                        {log.ip}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-[#e3b341] text-[11px] font-semibold cursor-pointer border border-white/10 font-[family-name:var(--font-pixelify)]"
                        >
                          {isExpanded ? 'Ocultar ▲' : 'Ver Detalles ▼'}
                        </button>
                      </td>
                    </tr>

                    {/* Fila expandible con los detalles antes / después */}
                    {isExpanded && (
                      <tr className="bg-[#0b1126]/90 border-t border-b border-[#e3b341]/20">
                        <td colSpan={7} className="p-4 font-mono text-[11px]">
                          <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-emerald-400 space-y-1">
                            <span className="text-white/40 block text-[10px] uppercase font-[family-name:var(--font-archivo)]">
                              Carga Estructurada de Auditoría (Sanitizada):
                            </span>
                            <pre className="text-xs overflow-x-auto">
                              {JSON.stringify(log.detalles, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-white/5 text-xs text-white/40 flex items-center justify-between font-[family-name:var(--font-archivo)]">
          <span>Total de 1.042 eventos inmutables registrados</span>
          <span className="text-emerald-400 font-[family-name:var(--font-pixelify)]">
            CONTRATO IAuditor ÍNTEGRO
          </span>
        </div>
      </div>
    </div>
  );
}
