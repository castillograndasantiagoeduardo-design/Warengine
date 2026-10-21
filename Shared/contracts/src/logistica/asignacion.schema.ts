import { z } from 'zod';

const observaciones = z.string().trim().max(500).optional();

export const asignarActivoEmpleadoSchema = z.object({
  empleadoId: z
    .string({ message: 'El empleado es obligatorio.' })
    .uuid({ message: 'El id del empleado no es valido.' }),
  fechaDevolucionEsperada: z.coerce.date().optional(),
  observaciones,
});

export const asignarActivoAreaSchema = z.object({
  areaId: z.number({ message: 'El area es obligatoria.' }).int().positive(),
  fechaDevolucionEsperada: z.coerce.date().optional(),
  observaciones,
});

export const devolverActivoSchema = z.object({ observaciones });

export type AsignarActivoEmpleadoInput = z.infer<typeof asignarActivoEmpleadoSchema>;
export type AsignarActivoAreaInput = z.infer<typeof asignarActivoAreaSchema>;
export type DevolverActivoInput = z.infer<typeof devolverActivoSchema>;
