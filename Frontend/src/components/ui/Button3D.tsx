import React from 'react';
import Link from 'next/link';

interface Button3DProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
}

export function Button3D({
  href,
  className = '',
  children,
  onClick,
  ...props
}: Button3DProps) {
  const combinedClasses = `btn-3d text-[clamp(12px,1.75vw,28px)] px-[2vw] py-[0.5vw] ${className}`;

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
