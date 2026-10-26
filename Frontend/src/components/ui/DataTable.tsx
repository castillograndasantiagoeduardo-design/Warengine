'use client';

/**
 * DataTable.tsx — Tabla genérica controlada con orden por columna y paginación.
 *
 * No guarda estado propio: el orden y la página vienen de fuera (normalmente de
 * useListado en @/lib/hooks), así sirve igual para datos en cliente o paginados en servidor.
 */

import React from 'react';
import { Skeleton } from './Skeleton';
import { Pagination } from './Pagination';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  empty?: React.ReactNode;
  sort?: SortState | null;
  onSortChange?: (sort: SortState) => void;
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  caption?: string;
}

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  empty,
  sort,
  onSortChange,
  page,
  totalPages,
  total,
  onPageChange,
  caption,
}: DataTableProps<T>) {
  const alternarOrden = (key: string) => {
    if (!onSortChange) return;
    const direction: SortDirection = sort?.key === key && sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange({ key, direction });
  };

  return (
    <div className="panel-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-white/60 font-[family-name:var(--font-ui)]">
            <tr>
              {columns.map((col) => {
                const activo = sort?.key === col.key;
                const ariaSort = activo ? (sort!.direction === 'asc' ? 'ascending' : 'descending') : undefined;
                return (
                  <th key={col.key} scope="col" aria-sort={ariaSort} className={`px-4 py-2 font-medium ${ALIGN[col.align ?? 'left']}`}>
                    {col.sortable && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => alternarOrden(col.key)}
                        className={`inline-flex min-h-[44px] items-center gap-1 uppercase tracking-wider cursor-pointer hover:text-white ${activo ? 'text-[#e9b949]' : ''}`}
                      >
                        {col.header}
                        <span aria-hidden="true">{activo ? (sort!.direction === 'asc' ? '▲' : '▼') : '↕'}</span>
                      </button>
                    ) : (
                      <span className="inline-flex min-h-[44px] items-center">{col.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading &&
              Array.from({ length: 5 }, (_, i) => (
                <tr key={`sk-${i}`}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading &&
              rows.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-white/[0.03] transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-white/85 ${ALIGN[col.align ?? 'left']} ${col.className ?? ''}`}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {!loading && rows.length === 0 && empty}
      {page !== undefined && totalPages !== undefined && onPageChange && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={onPageChange} />
      )}
    </div>
  );
}
