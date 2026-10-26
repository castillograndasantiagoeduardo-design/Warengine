'use client';

/**
 * Toast.tsx — Notificaciones efímeras (éxito, error, info).
 *
 * Uso:
 *   <ToastProvider> … </ToastProvider>   (montado en el shell del panel)
 *   const toast = useToast();
 *   toast.success('Sucursal creada');
 */

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

const DURACION_MS = 4500;

const TONE_CLASSES: Record<ToastTone, string> = {
  success: 'border-emerald-400/40 bg-emerald-950/90 text-emerald-100',
  error: 'border-red-400/40 bg-red-950/90 text-red-100',
  info: 'border-[#e3b341]/40 bg-[#14213d]/95 text-white',
};

const TONE_ICON: Record<ToastTone, string> = { success: '✔', error: '✖', info: 'ℹ' };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const siguienteId = useRef(1);

  const cerrar = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const mostrar = useCallback(
    (tone: ToastTone, message: string) => {
      const id = siguienteId.current++;
      setToasts((prev) => [...prev.slice(-3), { id, tone, message }]);
      setTimeout(() => cerrar(id), DURACION_MS);
    },
    [cerrar],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => mostrar('success', m),
      error: (m) => mostrar('error', m),
      info: (m) => mostrar('info', m),
    }),
    [mostrar],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="fixed z-[60] bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 left-4 sm:left-auto sm:w-96 flex flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={`toast-in flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur ${TONE_CLASSES[t.tone]}`}
          >
            <span aria-hidden="true">{TONE_ICON[t.tone]}</span>
            <p className="flex-1 leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => cerrar(t.id)}
              aria-label="Cerrar notificación"
              className="-m-2 min-h-[44px] min-w-[44px] text-lg opacity-60 hover:opacity-100 cursor-pointer"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser utilizado dentro de un <ToastProvider>');
  }
  return context;
}
