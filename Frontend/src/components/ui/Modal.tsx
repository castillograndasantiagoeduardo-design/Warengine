'use client';

/**
 * Modal.tsx — Diálogo modal accesible (Esc para cerrar, foco inicial, bloqueo de scroll).
 *
 * Se renderiza en un portal sobre document.body para escapar de contenedores con overflow.
 */

import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Botones de acción del pie (Cancelar / Guardar). */
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Impide cerrar con Esc o clic en el fondo (ej. mientras se envía un formulario). */
  locked?: boolean;
}

const SIZE_CLASSES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' } as const;

export function Modal({ open, onClose, title, description, children, footer, size = 'md', locked = false }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // Refs para que el efecto no se re-ejecute (y robe el foco) cuando el padre re-renderiza
  const onCloseRef = useRef(onClose);
  const lockedRef = useRef(locked);

  useEffect(() => {
    onCloseRef.current = onClose;
    lockedRef.current = locked;
  });

  useEffect(() => {
    if (!open) return;

    const previoFoco = document.activeElement as HTMLElement | null;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Foco en el primer control interactivo del modal
    const enfocable = panelRef.current?.querySelector<HTMLElement>(
      'input, select, textarea, button:not([data-modal-close]), [href], [tabindex]:not([tabindex="-1"])',
    );
    (enfocable ?? panelRef.current)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !lockedRef.current) onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflowPrevio;
      previoFoco?.focus();
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-hidden="true"
        onClick={() => !locked && onClose()}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`panel-card toast-in relative w-full ${SIZE_CLASSES[size]} max-h-[90dvh] flex flex-col rounded-b-none sm:rounded-2xl outline-none pb-[env(safe-area-inset-bottom)]`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h2 id={titleId} className="font-[family-name:var(--font-anton)] uppercase tracking-wider text-xl text-[#e9b949]">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-white/60">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            data-modal-close
            onClick={onClose}
            disabled={locked}
            aria-label="Cerrar"
            className="min-h-[44px] min-w-[44px] -mr-2 -mt-1 rounded-lg text-2xl leading-none text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-40 cursor-pointer"
          >
            ×
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-3 border-t border-white/10 px-5 py-4">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
