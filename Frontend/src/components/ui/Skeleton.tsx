/**
 * Skeleton.tsx — Placeholder animado mientras se cargan datos.
 */

interface SkeletonProps {
  className?: string;
  /** Repite el bloque N veces apilado (útil para filas de tabla). */
  lines?: number;
}

export function Skeleton({ className = 'h-4 w-full', lines = 1 }: SkeletonProps) {
  if (lines <= 1) {
    return <div aria-hidden="true" className={`skeleton ${className}`} />;
  }

  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={`skeleton ${className}`} />
      ))}
    </div>
  );
}
