'use client';

/**
 * SucursalVentasRecientes.tsx — Últimas facturas emitidas en la sede.
 */

import { Badge } from '@/components/ui/Badge';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCOP } from '@/lib/format/moneda';
import { formatFechaHora } from '@/lib/format/fecha';
import type { SucursalDetalle } from '../../../types';

type Venta = SucursalDetalle['ventasRecientes'][number];

const COLUMNAS: DataTableColumn<Venta>[] = [
  { key: 'consecutivo', header: 'Factura', render: (v) => <span className="font-medium text-white">#{v.consecutivo}</span> },
  { key: 'fecha', header: 'Fecha', render: (v) => formatFechaHora(v.fecha) },
  {
    key: 'cliente',
    header: 'Cliente',
    render: (v) => v.clienteNombre || <span className="text-white/50">Consumidor final</span>,
  },
  {
    key: 'estado',
    header: 'Estado',
    render: (v) => <Badge tone={v.estado.toLowerCase().includes('anul') ? 'danger' : 'success'}>{v.estado}</Badge>,
  },
  { key: 'total', header: 'Total', align: 'right', render: (v) => <strong className="text-white">{formatCOP(v.total)}</strong> },
];

export function SucursalVentasRecientes({ ventas }: { ventas: Venta[] }) {
  return (
    <section>
      <h2 className="mb-3 font-[family-name:var(--font-anton)] uppercase tracking-wider text-lg text-white">Ventas recientes</h2>
      <DataTable
        caption="Ventas recientes de la sucursal"
        columns={COLUMNAS}
        rows={ventas}
        rowKey={(v) => v.id}
        empty={<EmptyState title="Sin ventas registradas" description="Las facturas emitidas en el POS de esta sede aparecerán aquí." />}
      />
    </section>
  );
}
