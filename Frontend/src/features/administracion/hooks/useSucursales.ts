'use client';

/**
 * useSucursales.ts — Listado de sucursales con búsqueda, filtro por estado, orden y paginación.
 *
 * GET /administracion/sucursales devuelve todas las sedes (sin paginar), así que todo
 * se resuelve en cliente con useListado.
 */

import { useListado } from '@/lib/hooks/useListado';
import { sucursalesService } from '../api';
import type { Sucursal } from '../types';

export type FiltroEstado = 'todas' | 'activas' | 'inactivas';

export const FILTROS_ESTADO: { value: FiltroEstado; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'activas', label: 'Activas' },
  { value: 'inactivas', label: 'Inactivas' },
];

const buscarSucursal = (s: Sucursal, texto: string) =>
  [s.nombre, s.direccion, s.contacto].some((campo) => campo?.toLowerCase().includes(texto));

export function useSucursales() {
  return useListado<Sucursal, { estado: FiltroEstado }>({
    cargar: async ({ filtros }) => {
      const todas = await sucursalesService.listar();
      if (filtros.estado === 'todas') return todas;
      return todas.filter((s) => s.isActive === (filtros.estado === 'activas'));
    },
    filtrosIniciales: { estado: 'todas' },
    sortInicial: { key: 'nombre', direction: 'asc' },
    limit: 8,
    buscar: buscarSucursal,
  });
}
