import React from 'react';
import Link from 'next/link';

interface Button3DProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  size?: 'sm' | 'md' | 'lg' | 'responsive';
  className?: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
}

const SIZE_CLASSES: Record<NonNullable<Button3DProps['size']>, string> = {
  responsive: 'text-[clamp(12px,1.75vw,28px)] px-[2vw] py-[0.5vw]',
  sm: 'text-xs px-3.5 py-1.5 min-h-[38px] rounded-xl shadow-[0_3px_0_var(--gold-dark,#b88a1f)] font-bold',
  md: 'text-sm px-5 py-2 min-h-[42px] rounded-xl shadow-[0_3px_0_var(--gold-dark,#b88a1f)] font-bold',
  lg: 'text-base px-6 py-2.5 min-h-[48px] rounded-2xl shadow-[0_4px_0_var(--gold-dark,#b88a1f)] font-bold',
};

export function Button3D({
  href,
  size = 'responsive',
  className = '',
  children,
  onClick,
  ...props
}: Button3DProps) {
  const combinedClasses = `btn-3d ${SIZE_CLASSES[size]} ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        className={combinedClasses}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      className={combinedClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
