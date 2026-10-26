import React from 'react';
import Link from 'next/link';

export type Button3DSize = 'landing' | 'responsive' | 'panel' | 'panel-sm' | 'sm' | 'md' | 'lg';
export type Button3DVariant = 'gold' | 'navy' | 'danger' | 'success';

export interface Button3DProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  /** 'landing' / 'responsive' escala con el viewport; 'panel', 'sm', 'md', 'lg' usan medidas fijas. */
  size?: Button3DSize;
  variant?: Button3DVariant;
}

const SIZE_CLASSES: Record<Button3DSize, string> = {
  landing: 'text-[clamp(12px,1.75vw,28px)] px-[2vw] py-[0.5vw]',
  responsive: 'text-[clamp(12px,1.75vw,28px)] px-[2vw] py-[0.5vw]',
  sm: 'text-xs px-3.5 py-1.5 min-h-[38px] rounded-xl shadow-[0_3px_0_var(--gold-dark,#b88a1f)] font-bold',
  md: 'text-sm px-5 py-2 min-h-[42px] rounded-xl shadow-[0_3px_0_var(--gold-dark,#b88a1f)] font-bold',
  lg: 'text-base px-6 py-2.5 min-h-[48px] rounded-2xl shadow-[0_4px_0_var(--gold-dark,#b88a1f)] font-bold',
  panel: 'btn-3d-panel text-sm px-5',
  'panel-sm': 'btn-3d-panel text-xs px-3',
};

// Cada variante redefine los tokens de acento que consume .btn-3d (fondo, sombra 3D y texto).
const VARIANT_STYLES: Record<Button3DVariant, React.CSSProperties | undefined> = {
  gold: undefined,
  navy: { '--ac': '#394a68', '--ac-dk': '#263349', '--ac-fg': '#ffffff' } as React.CSSProperties,
  danger: { '--ac': '#b42318', '--ac-dk': '#7a1810', '--ac-fg': '#ffffff' } as React.CSSProperties,
  success: { '--ac': '#2f8f5b', '--ac-dk': '#1d5c3a', '--ac-fg': '#ffffff' } as React.CSSProperties,
};

export function Button3D({
  href,
  className = '',
  children,
  onClick,
  size = 'landing',
  variant = 'gold',
  style,
  ...props
}: Button3DProps) {
  const combinedClasses = `btn-3d ${SIZE_CLASSES[size]} ${className}`;
  const combinedStyle = { ...VARIANT_STYLES[variant], ...style };

  if (href) {
    return (
      <Link
        href={href}
        className={combinedClasses}
        style={combinedStyle}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      className={combinedClasses}
      style={combinedStyle}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
