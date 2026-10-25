'use client';

/**
 * SucursalesView.tsx — Gestión de sucursales: tabla, búsqueda, crear, editar y activar/inactivar.
 */

import { useCallback, useMemo, useState } from 'react';
import { PageHeader } from '@/components/panel/PageHeader';
import { Button3D } from '@/components/ui/Button3D';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useToast } from '@/components/ui/Toast';
import { FILTROS_ESTADO, useSucursales } from '../../hooks/useSucursales';
import { useCambiarEstadoSucursal } from '../../hooks/useCambiarEstadoSucursal';
import type { Sucursal } from '../../types';
import { columnasSucursales } from './sucursalesColumns';
import { SucursalFormModal } from './SucursalFormModal';
import { SucursalEstadoDialog } from './SucursalEstadoDialog';

export function SucursalesView() {
  const toast = useToast();
  const lista = useSucursales();
  const [formAbierto, setFormAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState<Sucursal | null>(null);
  const { recargar } = lista;

  const estado = useCambiarEstadoSucursal(useCallback(() => recargar(), [recargar]));

  const abrirCrear = () => {
    setEnEdicion(null);
    setFormAbierto(true);
  };

  const onGuardado = useCallback(
    (s: Sucursal, modo: 'crear' | 'editar') => {
      toast.success(modo === 'crear' ? `Sucursal "${s.nombre}" creada.` : `Cambios guardados en "${s.nombre}".`);
      setFormAbierto(false);
      recargar();
    },
    [toast, recargar],
  );

  const columnas = useMemo(
    () =>
      columnasSucursales({
        onEditar: (s) => {
          setEnEdicion(s);
          setFormAbierto(true);
        },
        onCambiarEstado: estado.solicitar,
      }),
    [estado.solicitar],
  );

  return (
    <div>
      <PageHeader
        title="Sucursales"
        subtitle="Sedes operativas registradas en la plataforma"
        actions={
          <Button3D size="panel" type="button" onClick={abrirCrear}>
            + Nueva sucursal
          </Button3D>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          ariaLabel="Filtrar por estado"
          options={FILTROS_ESTADO}
          value={lista.filtros.estado}
          onChange={(v) => lista.setFiltro('estado', v)}
        />
        <input
          type="search"
          value={lista.busqueda}
          onChange={(e) => lista.setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, dirección o contacto…"
          aria-label="Buscar sucursales"
          className="panel-input sm:max-w-xs"
        />
      </div>

      {lista.error ? (
        <div className="panel-card">
          <EmptyState
            icon="⚠"
            title="No se pudieron cargar las sucursales"
            description={lista.error}
            action={
              <Button3D size="panel" variant="navy" type="button" onClick={recargar}>
                Reintentar
              </Button3D>
            }
          />
        </div>
      ) : (
        <DataTable
          caption="Listado de sucursales"
          columns={columnas}
          rows={lista.rows}
          rowKey={(s) => s.id}
          loading={lista.loading}
          sort={lista.sort}
          onSortChange={lista.setSort}
          page={lista.page}
          totalPages={lista.totalPages}
          total={lista.total}
          onPageChange={lista.setPage}
          empty={
            <EmptyState
              title={lista.busqueda ? 'Sin coincidencias' : 'Aún no hay sucursales'}
              description={lista.busqueda ? 'Prueba con otro término de búsqueda.' : 'Crea la primera sede para empezar a operar.'}
            />
          }
        />
      )}

      <SucursalFormModal open={formAbierto} sucursal={enEdicion} onClose={() => setFormAbierto(false)} onGuardado={onGuardado} />
      <SucursalEstadoDialog
        sucursal={estado.objetivo}
        procesando={estado.procesando}
        onConfirm={estado.confirmar}
        onCancel={estado.cancelar}
      />
    </div>
  );
}
