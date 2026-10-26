'use client';

/**
 * RendimientoCard.tsx — Comparativo de ventas entre sucursales (RF-ADM-A3).
 */

import Link from 'next/link';
import { BarList } from '@/components/charts/BarList';
import { SectionCard } from '@/components/ui/SectionCard';
import { formatCOP, formatNumero } from '@/lib/format/moneda';
import type { RendimientoSucursal } from '../../types';

interface RendimientoCardProps {
  datos: RendimientoSucursal[] | null;
  loading: boolean;
  error: string | null;
  denied?: boolean;
  onRetry: () => void;
  /** Enlazar cada sede a su ficha (requiere administracion:gestionar-sucursales). */
  enlazarDetalle?: boolean;
}

export function RendimientoCard({ datos, loading, error, denied, onRetry, enlazarDetalle = false }: RendimientoCardProps) {
  const ordenados = [...(datos ?? [])].sort((a, b) => Number(b.totalVentas) - Number(a.totalVentas));

  return (
    <SectionCard
      title="Rendimiento por sucursal"
      subtitle="Ventas del periodo, de mayor a menor"
      loading={loading}
      error={error}
      denied={denied}
      onRetry={onRetry}
      isEmpty={ordenados.length === 0}
      emptyTitle="Sin datos de sucursales"
    >
      <BarList
        ariaLabel="Ventas por sucursal"
        items={ordenados.map((s) => ({
          key: s.sucursalId,
          label: s.nombreSucursal,
          value: Number(s.totalVentas) || 0,
          display: formatCOP(s.totalVentas),
          detail: `${formatNumero(s.totalFacturas)} facturas · ticket ${formatCOP(s.ticketPromedio)} · ganancia ${formatCOP(s.gananciaNeta)}`,
        }))}
        renderLink={enlazarDetalle ? (item, fila) => (
          <Link href={`/dashboard/sucursales/${item.key}`} className="block rounded-lg focus-visible:outline-2 focus-visible:outline-[#e3b341]">
            {fila}
          </Link>
        ) : undefined}
      />
    </SectionCard>
  );
}
