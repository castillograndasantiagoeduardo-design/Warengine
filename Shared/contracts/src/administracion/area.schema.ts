/**
 * area.schema.ts
 *
 * Contratos de validación Zod y tipos TypeScript para la gestión de áreas operativas por sucursal.
 *
 * Rol en la arquitectura:
 * - Capa Shared Contracts: única fuente de verdad compartida entre Backend y Frontend.
 * - Usado por los controladores HTTP para validar payloads de entrada (request body)
 *   y garantizar integridad antes de delegar a la capa de aplicación.
 *
 * Requisito SRS:
 * - RF-ADM-C4: Gestión de áreas por sucursal (Bodega, Caja, Ventas, etc.).
 */

import { z } from 'zod';

export const crearAreaSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre del área es obligatorio.' })
    .trim()
    .min(2, { message: 'El nombre del área debe tener al menos 2 caracteres.' })
    .max(100, { message: 'El nombre del área no puede exceder 100 caracteres.' }),
});

export const editarAreaSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre del área es obligatorio.' })
    .trim()
    .min(2, { message: 'El nombre del área debe tener al menos 2 caracteres.' })
    .max(100, { message: 'El nombre del área no puede exceder 100 caracteres.' }),
});

export type CrearAreaInput = z.infer<typeof crearAreaSchema>;
export type EditarAreaInput = z.infer<typeof editarAreaSchema>;
