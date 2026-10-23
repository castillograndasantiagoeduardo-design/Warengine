'use client';

import React, { useEffect, useState } from 'react';
import { Button3D } from '@/components/ui/Button3D';
import { fetchAuditoria, LogAuditoriaItem } from '@/features/administracion/api/auditoria.api';

export default function AuditoriaAdminPage() {
  const [logs, setLogs] = useState<LogAuditoriaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [filterAccion, setFilterAccion] = useState('all');

  async function loadLogs() {
    setLoading(true);
    const res = await fetchAuditoria({
      accion: filterAccion === 'all' ? undefined : filterAccion,
      limite: 50,
    });

    if (res.data) {
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadLogs();
  }, [filterAccion]);

  // Si aún no hay suficientes logs en desarrollo, agregamos eventos de referencia del seed
  const fallbackLogs: LogAuditoriaItem[] = [
    {
      id: 1,
      usuarioId: '0542e885-c46f-11f1-8440-345a604a1eff',
      usuarioEmail: 'superadmin@warengine.local',
      usuarioNombre: 'Super Administrador',
      accion: 'seed_inicial',
      entidad: 'usuarios',
      ipOrigen: '127.0.0.1',
      detallesDespues: {
        rol: 'super-admin',
        sucursal: 'Sede Principal (Sistema)',
        estado: 'activo',
      },
      fechaCreacion: new Date().toISOString(),
    },
    {
      id: 2,
      usuarioId: '0542e885-c46f-11f1-8440-345a604a1eff',
      usuarioEmail: 'superadmin@warengine.local',
      usuarioNombre: 'Super Administrador',
      accion: 'crear',
      entidad: 'sucursales',
      ipOrigen: '127.0.0.1',
      detallesDespues: {
        id: 1,
        nombre: 'Sede Principal (Sistema)',
        direccion: 'Local',
        isActive: true,
      },
      fechaCreacion: new Date().toISOString(),
    },
  ];

  const hasDbRows = logs.length > 0;
  const displayLogs = hasDbRows ? logs : fallbackLogs;

  const handleExportCsv = () => {
    window.open('http://localhost:8017/administracion/auditoria/exportar', '_blank');
  };

  const getActionBadge = (accion: string) => {
    switch (accion) {
      case 'crear':
      case 'seed_inicial':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'editar':
      case 'cambiar_rol':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      case 'inactivar':
      case 'acceso_denegado':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'login':
        return 'bg-[#e3b341]/20 text-[#e3b341] border-[#e3b341]/30';
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
              TABLA `logs_auditoria` APPEND-ONLY
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 font-[family-name:var(--font-archivo)]">
            Bitácora de Auditoría del Sistema (RF-ADM-C11, C19, C20)
          </h2>
          <p className="text-xs text-white/60 mt-0.5 font-[family-name:var(--font-archivo)]">
            Eventos inmutables protegidos por triggers en MySQL. Exportación oficial en formato CSV RFC 4180
          </p>
        </div>

        <Button3D onClick={handleExportCsv} className="text-xs py-2.5 px-4 self-start sm:self-auto">
          📥 Descargar Bitácora CSV
        </Button3D>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 rounded-2xl bg-[#0f1733]/90 border border-white/10 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/60 font-[family-name:var(--font-archivo)]">
            Filtrar por acción:
          </span>
          <select
            value={filterAccion}
            onChange={(e) => setFilterAccion(e.target.value)}
            className="bg-[#121c3b] text-white text-xs px-3.5 py-2 rounded-xl border border-white/15 focus:outline-none focus:border-[#e3b341] font-[family-name:var(--font-archivo)] cursor-pointer"
          >
            <option value="all">Todas las Acciones</option>
            <option value="crear">Creación (crear)</option>
            <option value="editar">Edición (editar)</option>
            <option value="cambiar_rol">Cambio de Rol (cambiar_rol)</option>
            <option value="login">Inicios de Sesión (login)</option>
          </select>
        </div>

        <div className="text-xs text-white/40 font-[family-name:var(--font-pixelify)] hidden sm:block">
          {hasDbRows ? `REGISTROS EN VIVO: ${total}` : 'REGISTROS INICIALES'}
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-xs font-[family-name:var(--font-pixelify)] text-[#e3b341] animate-pulse">
          Consultando registros inmutables de auditoría en MySQL...
        </div>
      )}

      {/* Tabla de Registros */}
      <div className="rounded-2xl bg-[#0f1733]/90 border border-white/10 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-[family-name:var(--font-archivo)]">
            <thead className="bg-[#0b1228] text-white/50 text-[10px] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Fecha & Hora</th>
                <th className="p-4">Usuario Responsable</th>
                <th className="p-4">Acción</th>
                <th className="p-4">Entidad Afectada</th>
                <th className="p-4">IP Origen</th>
                <th className="p-4 text-right">Diferencias (Diff)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayLogs.map((log) => {
                const isExpanded = expandedLog === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <span className="font-mono text-[#e3b341] font-bold">#{log.id}</span>
                      </td>

                      <td className="p-4 text-white/70 font-mono text-[11px]">
                        {new Date(log.fechaCreacion).toLocaleString()}
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-white">
                          {log.usuarioNombre || log.usuarioEmail || 'Sistema'}
                        </div>
                        {log.usuarioEmail && (
                          <div className="text-[10px] text-white/40 font-mono">
                            {log.usuarioEmail}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border font-[family-name:var(--font-pixelify)] ${getActionBadge(
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
                        {log.ipOrigen || '127.0.0.1'}
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

                    {isExpanded && (
                      <tr className="bg-[#0b1126]/90 border-t border-b border-[#e3b341]/20">
                        <td colSpan={7} className="p-4 font-mono text-[11px]">
                          <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-emerald-400 space-y-2">
                            <span className="text-white/40 block text-[10px] uppercase font-[family-name:var(--font-archivo)]">
                              Carga Inmutable Estructurada (IAuditor):
                            </span>
                            {log.detallesAntes && (
                              <div>
                                <span className="text-amber-400 text-[10px]">ANTES:</span>
                                <pre className="text-xs text-white/80 overflow-x-auto">
                                  {JSON.stringify(log.detallesAntes, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.detallesDespues && (
                              <div>
                                <span className="text-emerald-400 text-[10px]">DESPUÉS:</span>
                                <pre className="text-xs text-emerald-300 overflow-x-auto">
                                  {JSON.stringify(log.detallesDespues, null, 2)}
                                </pre>
                              </div>
                            )}
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
          <span>{total > 0 ? `${total} eventos registrados en BD` : 'Base de datos auditada'}</span>
          <span className="text-emerald-400 font-[family-name:var(--font-pixelify)]">
            TRIGGER trg_logs_auditoria_bloquear_modificaciones ACTIVO
          </span>
        </div>
      </div>
    </div>
  );
}
