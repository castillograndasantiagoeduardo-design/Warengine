'use client';

/**
 * useAuditoria.ts — Bitácora paginada en servidor con filtros por fecha, actor, acción y entidad.
 *
 * Los filtros se validan con consultarAuditoriaSchema (@warengine/contracts) antes de pedir;
 * si no son válidos no se hace la petición y se muestra el error en la barra de filtros.
 */

import { useMemo, useState } from 'react';
import { consultarAuditoriaSchema } from '@warengine/contracts';
import { usePermissions } from '@/features/autenticacion';
import { useListado } from '@/lib/hooks/useListado';
import { useRecurso } from '@/lib/hooks/useRecurso';
import { auditoriaService, usuariosService } from '../api';
import { PERMISOS_ADMIN } from '../permisos';
import type { FiltrosAuditoria, LogAuditoria } from '../types';

const TAMANO_PAGINA = 20;

/** Error legible si los filtros no pasan el esquema o el rango está invertido; null si son válidos. */
function validarFiltros(f: FiltrosAuditoria): string | null {
  const r = consultarAuditoriaSchema.safeParse({ ...f, pagina: 1, limite: TAMANO_PAGINA });
  if (!r.success) return r.error.issues[0]?.message ?? 'Filtros inválidos.';
  if (f.desde && f.hasta && f.desde > f.hasta) return 'La fecha final no puede ser anterior a la inicial.';
  return null;
}

export function useAuditoria() {
  const { tienePermiso } = usePermissions();
  const [errorFiltros, setErrorFiltros] = useState<string | null>(null);

  const lista = useListado<LogAuditoria, FiltrosAuditoria>({
    paginacion: 'servidor',
    limit: TAMANO_PAGINA,
    filtrosIniciales: {},
    cargar: async ({ filtros, page, limit }) => {
      const error = validarFiltros(filtros);
      setErrorFiltros(error);
      if (error) return [];
      return auditoriaService.consultar({ ...limpiar(filtros), pagina: page, limite: limit });
    },
  });

  // Actores para el filtro: requiere poder listar usuarios
  const puedeListarUsuarios = tienePermiso(PERMISOS_ADMIN.gestionarUsuarios);
  const actores = useRecurso(() => usuariosService.listar({ limite: 100 }), [], { habilitado: puedeListarUsuarios });
  const opcionesActor = useMemo(
    () => (actores.data?.items ?? []).map((u) => ({ value: u.id, label: `${u.nombre} · ${u.email}` })),
    [actores.data],
  );

  return { ...lista, errorFiltros, opcionesActor, filtrosActivos: limpiar(lista.filtros) };
}

/** Quita filtros vacíos para no enviarlos como query. */
function limpiar(f: FiltrosAuditoria): FiltrosAuditoria {
  return Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== '')) as FiltrosAuditoria;
}
