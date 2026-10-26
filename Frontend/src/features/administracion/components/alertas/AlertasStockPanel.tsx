'use client';

/**
 * AlertasStockPanel.tsx — Productos en o bajo el stock mínimo por sucursal (RF-ADM-A6).
 */

import { Forbidden } from '@/components/panel/Forbidden';
import { Badge } from '@/components/ui/Badge';
import { Button3D } from '@/components/ui/Button3D';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatNumero } from '@/lib/format/moneda';
import { useAlertasStock } from '../../hooks/useAlertas';
import type { AlertaStock } from '../../types';

const COLUMNAS: DataTableColumn<AlertaStock>[] = [
  {
    key: 'producto',
    header: 'Producto',
    render: (a) => (
      <div>
        <p className="font-medium text-white">{a.nombre}</p>
        <p className="text-xs text-white/50">SKU {a.sku}</p>
      </div>
    ),
  },
  { key: 'sucursalNombre', header: 'Sucursal' },
  { key: 'stockActual', header: 'Stock', align: 'right', render: (a) => formatNumero(a.stockActual) },
  { key: 'stockMinimo', header: 'Mínimo', align: 'right', render: (a) => formatNumero(a.stockMinimo) },
  {
    key: 'estado',
    header: 'Estado',
    render: (a) =>
      a.stockActual === 0 ? <Badge tone="danger">Agotado</Badge> : <Badge tone="warning">Faltan {formatNumero(a.faltante)}</Badge>,
  },
];

export function AlertasStockPanel() {
  const s = useAlertasStock();

  if (s.denegado) return <Forbidden />;
  if (s.error) {
    return (
      <div className="panel-card">
        <EmptyState icon="⚠" title="No se pudieron cargar las alertas de stock" description={s.error} action={<Button3D size="panel" variant="navy" type="button" onClick={s.recargar}>Reintentar</Button3D>} />
      </div>
    );
  }

  return (
    <DataTable
      caption="Productos bajo el stock mínimo"
      columns={COLUMNAS}
      rows={s.rows}
      rowKey={(a) => `${a.productoId}-${a.sucursalId}`}
      loading={s.loading}
      page={s.page}
      totalPages={s.totalPages}
      total={s.total}
      onPageChange={s.setPage}
      empty={<EmptyState icon="✔" title="Inventario saludable" description="Ningún producto está en o bajo su stock mínimo." />}
    />
  );
}
