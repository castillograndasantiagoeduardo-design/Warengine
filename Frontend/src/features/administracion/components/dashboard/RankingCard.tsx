'use client';

/**
 * RankingCard.tsx — Productos más y menos vendidos (RF-ADM-A4 / A5).
 */

import { BarList } from '@/components/charts/BarList';
import { SectionCard } from '@/components/ui/SectionCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { formatCOP, formatNumero } from '@/lib/format/moneda';
import type { ItemRankingProducto, OrdenRanking } from '../../types';

const ORDENES: { value: OrdenRanking; label: string }[] = [
  { value: 'mas_vendidos', label: 'Más vendidos' },
  { value: 'menos_vendidos', label: 'Menos vendidos' },
];

interface RankingCardProps {
  items: ItemRankingProducto[] | null;
  loading: boolean;
  error: string | null;
  denied?: boolean;
  onRetry: () => void;
  orden: OrdenRanking;
  onOrdenChange: (o: OrdenRanking) => void;
}

export function RankingCard({ items, loading, error, denied, onRetry, orden, onOrdenChange }: RankingCardProps) {
  const datos = items ?? [];

  return (
    <SectionCard
      title="Ranking de productos"
      subtitle="Por unidades vendidas en el periodo"
      loading={loading}
      error={error}
      denied={denied}
      onRetry={onRetry}
      isEmpty={datos.length === 0}
      emptyTitle="Sin productos vendidos"
      actions={<SegmentedControl ariaLabel="Orden del ranking" options={ORDENES} value={orden} onChange={onOrdenChange} />}
    >
      <BarList
        ariaLabel={orden === 'mas_vendidos' ? 'Productos más vendidos' : 'Productos menos vendidos'}
        color={orden === 'mas_vendidos' ? '#e3b341' : '#8fa3c7'}
        items={datos.map((p, i) => ({
          key: p.productoId,
          label: `${i + 1}. ${p.nombre}`,
          value: Number(p.cantidadVendida) || 0,
          display: `${formatNumero(p.cantidadVendida)} u.`,
          detail: `SKU ${p.sku} · recaudado ${formatCOP(p.totalRecaudado)} · ganancia ${formatCOP(p.gananciaGenerada)}`,
        }))}
      />
    </SectionCard>
  );
}
