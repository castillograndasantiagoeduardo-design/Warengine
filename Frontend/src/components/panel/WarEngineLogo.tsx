/**
 * WarEngineLogo.tsx — Isotipo geométrico de WarEngine (dorado y blanco).
 */

export function WarEngineLogo({ className = 'w-10' }: { className?: string }) {
  return (
    <svg viewBox="60 50 1015 575" xmlns="http://www.w3.org/2000/svg" className={`h-auto block ${className}`} role="img" aria-label="Logo WarEngine">
      <polygon fill="#D9A02D" points="75,85 445,215 490,305 428,452 600,213 665,300 487,610 385,425 235,318 180,240 360,305 130,165" />
      <polygon fill="#ffffff" points="1060,65 740,590 635,432 700,335 745,415 830,218 775,205" />
    </svg>
  );
}
