'use client';

/**
 * useTwoFactorForm.ts — Hook para gestionar el paso de verificación de segundo factor (2FA TOTP).
 *
 * Principio SOLID:
 * - Single Responsibility: Controla exclusivamente el ingreso del código de 6 dígitos
 *   y su validación contra el backend de WarEngine.
 */

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { ApiError } from '@/lib/api';

export function useTwoFactorForm() {
  const { paso2FA, completar2FA, cancelar2FA, rateLimit } = useAuth();

  const [codigoTotp, setCodigoTotp] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleCodigoChange = useCallback((nuevoValor: string) => {
    // Permitir solo números y máximo 6 caracteres
    const soloNumeros = nuevoValor.replace(/\D/g, '').slice(0, 6);
    setCodigoTotp(soloNumeros);
    setError(null);
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent, onSuccess?: () => void) => {
      if (e) {
        e.preventDefault();
      }

      setError(null);

      if (codigoTotp.length !== 6) {
        setError('El código TOTP debe contener exactamente 6 dígitos numéricos.');
        return;
      }

      setIsSubmitting(true);

      try {
        await completar2FA(codigoTotp);
        if (onSuccess) {
          onSuccess();
        }
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.code === 'CODIGO_TOTP_INVALIDO' || err.status === 400) {
            setError('Código de verificación incorrecto o expirado.');
          } else if (err.isLoginBloqueado()) {
            setError(
              err.message ||
                'Demasiados intentos de verificación. Intenta nuevamente en unos minutos.',
            );
          } else {
            setError(err.message || 'Error al validar el código 2FA.');
          }
        } else {
          setError('Error de conexión al verificar el segundo factor.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [codigoTotp, completar2FA],
  );

  return {
    codigoTotp,
    error,
    isSubmitting,
    rateLimit,
    mensajeInstruccion: paso2FA?.message,
    handleCodigoChange,
    handleSubmit,
    cancelar: cancelar2FA,
  };
}
