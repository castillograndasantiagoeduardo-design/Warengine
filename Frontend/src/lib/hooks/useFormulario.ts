'use client';

/**
 * useFormulario.ts — Estado de formulario validado con un esquema de @warengine/contracts.
 *
 * - Valida en el cliente con el mismo esquema Zod que usa el backend.
 * - Si la API responde VALIDATION_ERROR con issues, los pinta en los campos.
 * - Otros errores de dominio se muestran en `errorGeneral` (personalizables por código).
 *
 * `aPayload` convierte los valores del formulario (strings de inputs) al objeto
 * que espera el esquema (números, opcionales vacíos → undefined, etc.).
 */

import { useCallback, useState } from 'react';
import { ApiError } from '@/lib/api';
import {
  erroresDesdeIssues,
  mensajeDeError,
  type ErroresCampo,
  type EsquemaValidable,
} from '@/lib/forms/validacion';

interface OpcionesFormulario<V, O> {
  esquema: EsquemaValidable<O>;
  valoresIniciales: V;
  aPayload?: (valores: V) => unknown;
  onSubmit: (data: O) => Promise<void>;
  mensajesPorCodigo?: Record<string, string>;
}

export function useFormulario<V extends object, O>({
  esquema,
  valoresIniciales,
  aPayload,
  onSubmit,
  mensajesPorCodigo,
}: OpcionesFormulario<V, O>) {
  const [valores, setValores] = useState<V>(valoresIniciales);
  const [errores, setErrores] = useState<ErroresCampo>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const setCampo = useCallback(<K extends keyof V>(campo: K, valor: V[K]) => {
    setValores((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo as string]: undefined }));
    setErrorGeneral(null);
  }, []);

  const reset = useCallback((nuevos: V) => {
    setValores(nuevos);
    setErrores({});
    setErrorGeneral(null);
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const resultado = esquema.safeParse(aPayload ? aPayload(valores) : valores);

      if (!resultado.success) {
        const nuevos = erroresDesdeIssues(resultado.error.issues);
        setErrores(nuevos);
        setErrorGeneral(nuevos._form ?? null);
        return false;
      }

      setEnviando(true);
      setErrorGeneral(null);
      try {
        await onSubmit(resultado.data);
        return true;
      } catch (error) {
        if (error instanceof ApiError && error.issues?.length) {
          setErrores(erroresDesdeIssues(error.issues));
        }
        setErrorGeneral(mensajeDeError(error, mensajesPorCodigo));
        return false;
      } finally {
        setEnviando(false);
      }
    },
    [esquema, aPayload, valores, onSubmit, mensajesPorCodigo],
  );

  return { valores, errores, errorGeneral, enviando, setCampo, reset, handleSubmit };
}

/** '' → undefined; útil en aPayload para campos opcionales. */
export function vacioAUndefined(valor: string): string | undefined {
  const limpio = valor.trim();
  return limpio === '' ? undefined : limpio;
}
