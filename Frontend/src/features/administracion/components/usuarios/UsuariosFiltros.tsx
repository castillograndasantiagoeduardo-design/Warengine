'use client';

/**
 * UsuariosFiltros.tsx — Filtros combinables del directorio: estado, rol, sucursal y texto.
 */

import type { RolResumenDto } from '@warengine/contracts';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { etiquetaRol } from '@/lib/format/rol';
import { FILTROS_ESTADO_USUARIO, type FiltroEstadoUsuario } from '../../hooks/useUsuarios';
import type { Sucursal } from '../../types';

interface UsuariosFiltrosProps {
  estado: FiltroEstadoUsuario;
  onEstado: (e: FiltroEstadoUsuario) => void;
  rolId?: number;
  onRol: (id: number | undefined) => void;
  roles: RolResumenDto[];
  sucursalId?: number;
  onSucursal: (id: number | undefined) => void;
  sucursales: Sucursal[];
  texto: string;
  onTexto: (t: string) => void;
}

const aNumero = (v: string) => (v ? Number(v) : undefined);

export function UsuariosFiltros(p: UsuariosFiltrosProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <SegmentedControl ariaLabel="Filtrar por estado" options={FILTROS_ESTADO_USUARIO} value={p.estado} onChange={p.onEstado} />
      <div className="flex flex-col gap-3 sm:flex-row">
        {p.roles.length > 0 && (
          <select aria-label="Filtrar por rol" className="panel-input sm:w-48 cursor-pointer" value={p.rolId ?? ''} onChange={(e) => p.onRol(aNumero(e.target.value))}>
            <option value="">Todos los roles</option>
            {p.roles.map((r) => (
              <option key={r.id} value={r.id}>
                {etiquetaRol(r.nombre)}
              </option>
            ))}
          </select>
        )}
        {p.sucursales.length > 0 && (
          <select
            aria-label="Filtrar por sucursal"
            className="panel-input sm:w-52 cursor-pointer"
            value={p.sucursalId ?? ''}
            onChange={(e) => p.onSucursal(aNumero(e.target.value))}
          >
            <option value="">Todas las sucursales</option>
            {p.sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        )}
        <input
          type="search"
          value={p.texto}
          onChange={(e) => p.onTexto(e.target.value)}
          placeholder="Buscar por nombre o correo…"
          aria-label="Buscar usuarios"
          className="panel-input sm:w-64"
        />
      </div>
    </div>
  );
}
