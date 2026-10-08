import { z } from 'zod';

export const TIPOS_DOCUMENTO_CLIENTE = ['CC', 'NIT', 'RUT'] as const;
export const TIPOS_CLIENTE = ['B2C', 'B2B'] as const;

/** Un campo opcional enviado como "" se trata como "no enviado". */
const vacioAUndefined = (valor: unknown) =>
  typeof valor === 'string' && valor.trim() === '' ? undefined : valor;

export const crearClienteSchema = z
  .object({
    tipoDocumento: z.enum(TIPOS_DOCUMENTO_CLIENTE, {
      message: 'El tipo de documento debe ser CC, NIT o RUT.',
    }),
    numeroDocumento: z
      .string({ required_error: 'El número de documento es obligatorio.' })
      .trim()
      .min(5, { message: 'El documento debe tener al menos 5 caracteres.' })
      .max(30)
      .regex(/^[0-9A-Za-z-]+$/, {
        message: 'El documento solo admite letras, números y guion.',
      }),
    nombreRazonSocial: z
      .string({ required_error: 'El nombre o razón social es obligatorio.' })
      .trim()
      .min(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
      .max(200),
    tipoCliente: z.enum(TIPOS_CLIENTE).default('B2C'),
    email: z.preprocess(
      vacioAUndefined,
      z.string().trim().email({ message: 'Ingresa un correo válido.' }).max(150).optional(),
    ),
    telefono: z.preprocess(vacioAUndefined, z.string().trim().min(7).max(30).optional()),
    direccion: z.preprocess(vacioAUndefined, z.string().trim().min(5).max(255).optional()),
  })
  .superRefine((datos, ctx) => {
    // RF-FMC-B5: dirección y teléfono solo son obligatorios para clientes B2B.
    if (datos.tipoCliente === 'B2B') {
      if (!datos.direccion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['direccion'],
          message: 'La dirección es obligatoria para clientes B2B.',
        });
      }
      if (!datos.telefono) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['telefono'],
          message: 'El teléfono es obligatorio para clientes B2B.',
        });
      }
    }
  });

// Vienen por query string, por eso coerce (igual que filtrosUsuariosSchema)
export const filtrosClientesSchema = z.object({
  texto: z.string().trim().max(100).optional(),
  tipoDocumento: z.enum(TIPOS_DOCUMENTO_CLIENTE).optional(),
  limite: z.coerce.number().int().min(1).max(50).default(20),
});

/** DTO de salida: lo que el FRONT recibe. */
export interface ClienteDto {
  id: string;
  tipoDocumento: (typeof TIPOS_DOCUMENTO_CLIENTE)[number];
  numeroDocumento: string;
  nombreRazonSocial: string;
  tipoCliente: (typeof TIPOS_CLIENTE)[number];
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  creditoHabilitado: boolean;
}

export type CrearClienteInput = z.infer<typeof crearClienteSchema>;
export type FiltrosClientesInput = z.infer<typeof filtrosClientesSchema>;
