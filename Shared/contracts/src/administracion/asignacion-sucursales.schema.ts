import { z } from 'zod';

// RF-ADM-C10: asignación de un usuario a una o varias sucursales.
// La principal es obligatoria (su sede de trabajo); las adicionales son opcionales.
export const asignarSucursalesSchema = z.object({
  sucursalPrincipalId: z
    .number({
      required_error: 'La sucursal principal es obligatoria.',
      invalid_type_error: 'La sucursal principal debe ser un número.',
    })
    .int()
    .positive(),
  sucursalesAdicionalesIds: z
    .array(z.number().int().positive())
    .max(50, { message: 'No se pueden asignar más de 50 sucursales adicionales.' })
    .default([]),
});

export type AsignarSucursalesInput = z.infer<typeof asignarSucursalesSchema>;