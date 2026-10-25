'use client';

/**
 * EmpleadosView.tsx — Directorio de empleados con filtros, edición de ficha y aumentos salariales.
 */

import { useCallback, useMemo, useState } from 'react';
import { PERMISSIONS } from '@warengine/contracts';
import { usePermissions } from '@/features/autenticacion';
import { PageHeader } from '@/components/panel/PageHeader';
import { Button3D } from '@/components/ui/Button3D';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useToast } from '@/components/ui/Toast';
import { FILTROS_ESTADO_EMPLEADO, useEmpleados } from '../../hooks/useEmpleados';
import type { Empleado } from '../../types';
import { columnasEmpleados } from './empleadosColumns';
import { EmpleadoFormModal } from './EmpleadoFormModal';
import { SalarioModal } from './SalarioModal';

export function EmpleadosView() {
  const toast = useToast();
  const { tienePermiso } = usePermissions();
  const lista = useEmpleados();
  const { recargar } = lista;
  const [enEdicion, setEnEdicion] = useState<Empleado | null>(null);
  const [enSalario, setEnSalario] = useState<Empleado | null>(null);
  const puedeSalarios = tienePermiso(PERMISSIONS.ADMIN_GESTIONAR_SALARIOS);

  const onGuardado = useCallback(
    (e: Empleado) => {
      toast.success(`Datos de ${e.nombre} actualizados.`);
      setEnEdicion(null);
      recargar();
    },
    [toast, recargar],
  );

  const onAumentoRegistrado = useCallback(
    (sueldo: number) => {
      setEnSalario((prev) => (prev ? { ...prev, sueldoActual: sueldo } : prev));
      recargar();
    },
    [recargar],
  );

  const columnas = useMemo(
    () => columnasEmpleados({ onEditar: setEnEdicion, onSalarios: puedeSalarios ? setEnSalario : undefined }),
    [puedeSalarios],
  );

  return (
    <div>
      <PageHeader title="Empleados" subtitle="Personal de todas las sedes, cargos, áreas y salarios" />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl
          ariaLabel="Filtrar por estado"
          options={FILTROS_ESTADO_EMPLEADO}
          value={lista.filtros.estado}
          onChange={(v) => lista.setFiltro('estado', v)}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          {lista.puedeVerSucursales && (
            <select
              aria-label="Filtrar por sucursal"
              className="panel-input sm:w-56 cursor-pointer"
              value={lista.filtros.sucursalId ?? ''}
              onChange={(e) => lista.setFiltro('sucursalId', e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Todas las sucursales</option>
              {lista.sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          )}
          <input
            type="search"
            value={lista.busqueda}
            onChange={(e) => lista.setBusqueda(e.target.value)}
            placeholder="Buscar nombre, documento, cargo…"
            aria-label="Buscar empleados"
            className="panel-input sm:w-72"
          />
        </div>
      </div>

      {lista.error ? (
        <div className="panel-card">
          <EmptyState
            icon="⚠"
            title="No se pudieron cargar los empleados"
            description={lista.error}
            action={<Button3D size="panel" variant="navy" type="button" onClick={recargar}>Reintentar</Button3D>}
          />
        </div>
      ) : (
        <DataTable
          caption="Listado de empleados"
          columns={columnas}
          rows={lista.rows}
          rowKey={(e) => e.id}
          loading={lista.loading}
          sort={lista.sort}
          onSortChange={lista.setSort}
          page={lista.page}
          totalPages={lista.totalPages}
          total={lista.total}
          onPageChange={lista.setPage}
          empty={<EmptyState title="Sin empleados" description="No hay empleados que coincidan con los filtros." />}
        />
      )}

      <EmpleadoFormModal empleado={enEdicion} onClose={() => setEnEdicion(null)} onGuardado={onGuardado} />
      <SalarioModal empleado={enSalario} onClose={() => setEnSalario(null)} onAumentoRegistrado={onAumentoRegistrado} />
    </div>
  );
}
