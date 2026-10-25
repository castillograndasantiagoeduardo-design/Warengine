'use client';

/**
 * Pagination.tsx — Controles de página anterior/siguiente con contador.
 */

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  onPageChange: (page: number) => void;
}

const BTN =
  'min-h-[44px] min-w-[44px] rounded-lg border border-white/15 px-3 text-sm hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer';

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-2 text-xs text-white/60">
      <span>
        Página <strong className="text-white">{page}</strong> de {totalPages}
        {total !== undefined && <> · {total} registros</>}
      </span>
      <div className="flex gap-2">
        <button type="button" className={BTN} onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Página anterior">
          ‹
        </button>
        <button type="button" className={BTN} onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="Página siguiente">
          ›
        </button>
      </div>
    </nav>
  );
}
