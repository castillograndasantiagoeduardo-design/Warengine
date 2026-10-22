import { z } from 'zod';

export const itemDevolucionInputSchema = z.object({
  facturaItemId: z.string().uuid({ message: 'El ID de la línea de factura debe ser un UUID válido.' }),
  cantidad: z.number().int().positive({ message: 'La cantidad a devolver debe ser mayor a 0.' }),
});

// Total: devolverTodo = true. Parcial: lista de items.
export const registrarDevolucionSchema = z.object({
  motivo: z.string().trim().min(5, 'Indica el motivo (mín. 5 caracteres).').max(255),
  reingresaStock: z.boolean().default(true),
  devolverTodo: z.boolean().default(false),
  items: z.array(itemDevolucionInputSchema).default([]),
}).superRefine((d, ctx) => {
  if (!d.devolverTodo && d.items.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['items'],
      message: 'Indica los ítems a devolver o marca devolución total.' });
  }
});

export interface DevolucionVentaDto {
  id: string;
  facturaId: string;
  facturaItemId: string;
  cantidad: number;
  motivo: string;
  montoReembolso: number;
  reingresaStock: boolean;
  usuarioId: string;
  sucursalId: number;
  fecha: string;
}