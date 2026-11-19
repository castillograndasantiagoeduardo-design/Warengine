'use client';

/**
 * ModalVidrio.tsx — Cascarón de diálogo modal accesible con Glassmorphism (.vidrio-popover)
 * para el módulo de Vendedor B2B.
 *
 * Características:
 * - Renderizado en Portal (document.body).
 * - Cierre accesible con tecla Escape y clic en backdrop.
 * - Bloqueo de scroll en document.body.
 * - Superficie translúcida de alta densidad (.vidrio-popover) con bordes suaves.
 */

import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalVidrioProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  locked?: boolean;
  className?: string;
  bodyClassName?: string;
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-3xl',
  '3xl': 'max-w-4xl',
  '4xl': 'max-w-5xl',
  '5xl': 'max-w-6xl',
} as const;

export function ModalVidrio({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  locked = false,
  className = '',
  bodyClassName = '',
}: ModalVidrioProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const onCloseRef = useRef(onClose);
  const lockedRef = useRef(locked);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
    lockedRef.current = locked;
  });

  useEffect(() => {
    if (!open) return;

    const previoFoco = document.activeElement as HTMLElement | null;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !lockedRef.current) {
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflowPrevio;
      previoFoco?.focus();
    };
  }, [open]);

  if (!open || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Fondo difuminado accesible */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
        onClick={() => {
          if (!locked) onClose();
        }}
      />

      {/* Panel con superficie .vidrio-popover */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`vidrio-popover relative w-full ${SIZE_CLASSES[size]} max-h-[90dvh] flex flex-col rounded-2xl outline-none shadow-2xl text-text font-sans overflow-hidden border border-border ${className}`}
      >
        {/* Cabecera opcional */}
        {title && (
          <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 shrink-0">
            <div className="min-w-0">
              <h2
                id={titleId}
                className="font-titulos font-semibold text-base sm:text-lg text-text tracking-normal truncate"
              >
                {title}
              </h2>
              {description && (
                <p
                  id={descriptionId}
                  className="mt-0.5 text-xs font-sans font-medium text-text-muted truncate"
                >
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={locked}
              aria-label="Cerrar modal"
              className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-slate-900/5 dark:hover:bg-white/8 transition-colors shrink-0 cursor-pointer disabled:opacity-40"
            >
              <X className="w-4 h-4" />
            </button>
          </header>
        )}

        {/* Cuerpo del Modal */}
        <div
          className={`p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar ${bodyClassName}`}
        >
          {children}
        </div>

        {/* Pie de acciones opcional */}
        {footer && (
          <footer className="border-t border-border px-5 py-3.5 bg-black/[0.02] dark:bg-white/[0.02] shrink-0">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
