'use client';

/**
 * useDosFactores.ts — Configurar, activar y desactivar el 2FA TOTP de la cuenta.
 *
 * Flujo de activación: configurar (genera secreto + otpauth) → escanear el QR →
 * confirmar con un código de 6 dígitos (activar2faSchema). El secreto solo vive en
 * memoria del componente mientras dura el flujo; nunca se persiste en el navegador.
 */

import { useCallback, useState } from 'react';
import { activar2faSchema, desactivar2faSchema, type Activar2faInput, type Desactivar2faInput } from '@warengine/contracts';
import { useToast } from '@/components/ui/Toast';
import { mensajeDeError } from '@/lib/forms/validacion';
import { useFormulario } from '@/lib/hooks/useFormulario';
import { dosFactoresService, type Configuracion2FA } from '../api/dos-factores.service';

const MENSAJES = {
  CODIGO_TOTP_INVALIDO: 'El código no es válido o ya expiró. Usa el código actual de tu app.',
  CREDENCIALES_INVALIDAS: 'La contraseña no es correcta.',
};

export function useActivar2FA() {
  const toast = useToast();
  const [config, setConfig] = useState<Configuracion2FA | null>(null);
  const [generando, setGenerando] = useState(false);
  const [activado, setActivado] = useState(false);

  const form = useFormulario<{ codigoTotp: string }, Activar2faInput>({
    esquema: activar2faSchema,
    valoresIniciales: { codigoTotp: '' },
    aPayload: (v) => ({ codigoTotp: v.codigoTotp, secretBase32: config?.secretBase32 }),
    mensajesPorCodigo: MENSAJES,
    onSubmit: async (data) => {
      await dosFactoresService.activar(data);
      setConfig(null);
      setActivado(true);
      toast.success('Verificación en dos pasos activada. Se pedirá en tu próximo inicio de sesión.');
    },
  });

  const { reset } = form;
  const generar = useCallback(async () => {
    setGenerando(true);
    setActivado(false);
    try {
      setConfig(await dosFactoresService.configurar());
      reset({ codigoTotp: '' });
    } catch (error) {
      toast.error(mensajeDeError(error));
    } finally {
      setGenerando(false);
    }
  }, [toast, reset]);

  const cancelar = useCallback(() => {
    setConfig(null);
    reset({ codigoTotp: '' });
  }, [reset]);

  return { config, generando, activado, generar, cancelar, form };
}

export function useDesactivar2FA() {
  const toast = useToast();
  const form = useFormulario<Desactivar2faInput, Desactivar2faInput>({
    esquema: desactivar2faSchema,
    valoresIniciales: { password: '' },
    mensajesPorCodigo: MENSAJES,
    onSubmit: async (data) => {
      await dosFactoresService.desactivar(data);
      toast.success('Verificación en dos pasos desactivada.');
    },
  });

  const { handleSubmit, reset } = form;
  const enviar = useCallback(
    async (e?: React.FormEvent) => {
      // Tras desactivar se borra la contraseña del formulario; si falla se conserva el
      // mensaje de error para que el usuario corrija
      if (await handleSubmit(e)) reset({ password: '' });
    },
    [handleSubmit, reset],
  );

  return { ...form, enviar };
}
