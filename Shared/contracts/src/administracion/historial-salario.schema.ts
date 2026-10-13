/**
 * historial-salario.schema.ts
 *
 * Contratos de validación Zod y tipos TypeScript para la gestión del historial salarial de empleados.
 *
 * Requisito SRS:
 * - RF-ADM-C14: Historial de salarios de empleados (registro de ajustes salariales y consulta de trayectoria).
 */

import { z } from 'zod';

const tieneMaximoDosDecimales = (val: number) => {
  const str = val.toString();
  const decimales = str.includes('.') ? str.split('.')[1].length : 0;
  return decimales <= 2;
};

export const registrarAumentoSalarioSchema = z.object({
  sueldo: z
    .number({ required_error: 'El sueldo es obligatorio.' })
    .positive({ message: 'El sueldo debe ser mayor a 0.' })
    .refine(tieneMaximoDosDecimales, {
      message: 'El sueldo no puede tener más de 2 decimales.',
    }),
  fechaEfectiva: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido. Debe ser YYYY-MM-DD.')
    .optional(),
  motivo: z
    .string()
    .trim()
    .max(255, { message: 'El motivo no puede exceder 255 caracteres.' })
    .optional()
    .nullable(),
});

export type RegistrarAumentoSalarioInput = z.infer<typeof registrarAumentoSalarioSchema>;
