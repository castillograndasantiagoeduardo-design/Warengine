'use client';

/**
 * AuditoriaView.tsx — Visor inmutable de eventos críticos con filtros, detalle y exportación CSV.
 */

import { useMemo, useState } from 'react';
import { Forbidden } from '@/components/panel/Forbidden';
import { PageHeader } from '@/components/panel/PageHeader';
import { Button3D } from '@/components/ui/Button3D';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useAuditoria } from '../../hooks/useAuditoria';
import { useExportarAuditoria } from '../../hooks/useExportarAuditoria';
import type { LogAuditoria } from '../../types';
import { AuditoriaFiltros } from './AuditoriaFiltros';
import { columnasAuditoria } from './auditoriaColumns';
import { DetalleAuditoriaModal } from './DetalleAuditoriaModal';

export function AuditoriaView() {
  const a = useAuditoria();
  const { exportando, exportar } = useExportarAuditoria();
  const [detalle, setDetalle] = useState<LogAuditoria | null>(null);
  const columnas = useMemo(() => columnasAuditoria(setDetalle), []);

  return (
    <div>
      <PageHeader
        title="Auditoría"
        subtitle="Registro inmutable de creaciones, cambios, bajas y accesos"
        actions={
          <Button3D size="panel" variant="navy" type="button" onClick={() => exportar(a.filtrosActivos)} disabled={exportando || Boolean(a.errorFiltros)}>
            {exportando && <Spinner size={16} />}
            Exportar CSV
          </Button3D>
        }
      />

      <AuditoriaFiltros filtros={a.filtros} onCambio={a.setFiltro} opcionesActor={a.opcionesActor} error={a.errorFiltros} />

      {a.denegado ? (
        <Forbidden />
      ) : a.error ? (
        <div className="panel-card">
          <EmptyState icon="⚠" title="No se pudo cargar la auditoría" description={a.error} action={<Button3D size="panel" variant="navy" type="button" onClick={a.recargar}>Reintentar</Button3D>} />
        </div>
      ) : (
        <DataTable
          caption="Eventos de auditoría"
          columns={columnas}
          rows={a.rows}
          rowKey={(l) => l.id}
          loading={a.loading}
          page={a.page}
          totalPages={a.totalPages}
          total={a.total}
          onPageChange={a.setPage}
          empty={<EmptyState title="Sin eventos" description="No hay registros de auditoría con estos filtros." />}
        />
      )}

      <DetalleAuditoriaModal log={detalle} onClose={() => setDetalle(null)} />
    </div>
  );
}
