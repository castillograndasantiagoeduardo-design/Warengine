'use client';

/**
 * useLoginForm.ts — Hook para gestionar el estado, validación y envío del formulario de login.
 *
 * Principios aplicados:
 * - Single Responsibility (SRP): Aísla la lógica de captura de inputs, validación Zod
 *   y mapeo de errores del componente visual de la tarjeta de login.
 * - Single Source of Truth: Emplea loginSchema importado de @warengine/contracts.
 */

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { loginSchema } from '@warengine/contracts';
import { ApiError } from '@/lib/api';
import type { LoginResult } from '../types/auth.types';

export interface LoginFormValues {
  email: string;
  password: string;
  recordarme: boolean;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
}

export function useLoginForm() {
  const { login, rateLimit } = useAuth();

  const [values, setValues] = useState<LoginFormValues>({
    email: '',
    password: '',
    recordarme: false,
  });

  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const setCampo = useCallback(
    <K extends keyof LoginFormValues>(campo: K, valor: LoginFormValues[K]) => {
      setValues((prev) => ({ ...prev, [campo]: valor }));
      // Limpiar error del campo modificado
      setErrors((prev) => ({ ...prev, [campo]: undefined }));
      setErrorGeneral(null);
    },
    [],
  );

  const validarFormulario = useCallback((): boolean => {
    const parseResult = loginSchema.safeParse(values);

    if (parseResult.success) {
      setErrors({});
      return true;
    }

    const nuevosErrores: LoginFormErrors = {};
    parseResult.error.errors.forEach((issue) => {
      const campo = issue.path[0] as keyof LoginFormErrors;
      if (campo && !nuevosErrores[campo]) {
        nuevosErrores[campo] = issue.message;
      }
    });

    setErrors(nuevosErrores);
    return false;
  }, [values]);

  const handleSubmit = useCallback(
    async (
      e?: React.FormEvent,
      onSuccess?: (resultado: LoginResult) => void,
    ) => {
      if (e) {
        e.preventDefault();
      }

      setErrorGeneral(null);

      if (rateLimit.bloqueado) {
        setErrorGeneral(
          rateLimit.mensaje ||
            `Acceso temporalmente bloqueado. Espera ${rateLimit.tiempoRestanteSegundos} segundos.`,
        );
        return;
      }

      if (!validarFormulario()) {
        return;
      }

      setIsSubmitting(true);

      try {
        const resultado = await login(values);

        if (onSuccess) {
          onSuccess(resultado);
        }
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.isCredencialesInvalidas()) {
            setErrorGeneral('Correo o contraseña incorrectos.');
          } else if (error.isUsuarioInactivo()) {
            setErrorGeneral('Tu cuenta se encuentra inactiva. Contacta al administrador del sistema.');
          } else if (error.isLoginBloqueado()) {
            setErrorGeneral(
              error.message ||
                'Demasiados intentos fallidos. Por tu seguridad, el acceso ha sido pausado.',
            );
          } else {
            setErrorGeneral(error.message || 'Error al procesar la solicitud.');
          }
        } else {
          setErrorGeneral('Error inesperado de conexión con el servidor.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validarFormulario, login, rateLimit],
  );

  const limpiarErrores = useCallback(() => {
    setErrors({});
    setErrorGeneral(null);
  }, []);

  return {
    values,
    errors,
    errorGeneral,
    isSubmitting,
    showPassword,
    rateLimit,
    setShowPassword,
    setCampo,
    handleSubmit,
    limpiarErrores,
  };
}
