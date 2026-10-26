import { z } from 'zod';
import { PRIORIDADES_ALERTA, type PrioridadAlerta } from '../administracion/alerta-admin.schema.ts';

export const CODIGOS_MOTIVO_ALERTA_POS = [
  'caja_falta_cambio',
  'caja_autorizacion',
  'caja_falla_tecnica',
  'caja_cliente_disconforme',
  'otro',
] as const;

export type CodigoMotivoAlertaPos = (typeof CODIGOS_MOTIVO_ALERTA_POS)[number];

export const MAPA_MOTIVOS_ALERTA_POS: Record<string, string> = {
  caja_falta_cambio: 'Falta de Cambio en Gaveta (Monedas / Billetes)',
  caja_autorizacion: 'Solicitud de Autorización Especial',
  caja_falla_tecnica: 'Falla Técnica de Datáfono o Impresora',
  caja_cliente_disconforme: 'Asistencia en Mostrador',
  otro: 'Otro incidente operativo',
};

/**
 * Esquema de validación y normalización para emitir alertas operativas desde la caja (POS) al administrador.
 * Cumple con el principio de robustez: procesa 'motivo'/'descripcion' canónicos y admite 'tipo'/'mensaje'.
 */
export const emitirAlertaFacturacionSchema = z
  .object({
    sucursalId: z.coerce.number().int().positive().optional(),
    motivo: z
      .string()
      .trim()
      .max(100, { message: 'El motivo no puede exceder 100 caracteres.' })
      .optional(),
    tipo: z.string().trim().optional(),
    prioridad: z
      .enum(PRIORIDADES_ALERTA, {
        invalid_type_error: 'La prioridad debe ser "urgente" o "normal".',
      })
      .default('normal'),
    descripcion: z
      .string()
      .trim()
      .max(500, { message: 'La descripción no puede exceder 500 caracteres.' })
      .optional()
      .nullable(),
    mensaje: z
      .string()
      .trim()
      .max(500, { message: 'El mensaje no puede exceder 500 caracteres.' })
      .optional()
      .nullable(),
  })
  .transform((data) => {
    const rawMotivo = data.motivo || data.tipo || '';
    const motivoFinal = MAPA_MOTIVOS_ALERTA_POS[rawMotivo] || rawMotivo;
    const rawDescripcion = data.descripcion !== undefined ? data.descripcion : data.mensaje;
    const descripcionFinal = rawDescripcion ? rawDescripcion.trim() : null;

    return {
      sucursalId: data.sucursalId,
      motivo: motivoFinal,
      prioridad: data.prioridad as PrioridadAlerta,
      descripcion: descripcionFinal,
    };
  })
  .superRefine((data, ctx) => {
    if (!data.motivo || data.motivo.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['motivo'],
        message: 'El motivo o asunto de la alerta es obligatorio y debe tener al menos 2 caracteres.',
      });
    }
  });

export type EmitirAlertaFacturacionInput = z.input<typeof emitirAlertaFacturacionSchema>;
export type EmitirAlertaFacturacionPayload = z.output<typeof emitirAlertaFacturacionSchema>;
