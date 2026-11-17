import { z } from 'zod';

export const TIPOS_DOCUMENTO_CLIENTE = ['CC', 'NIT', 'RUT'] as const;
export const TIPOS_CLIENTE = ['B2C', 'B2B'] as const;
export const PLAZOS_CREDITO_DIAS = [15, 30, 45, 60] as const;
export const NIVELES_RIESGO_CREDITO = ['bajo', 'medio', 'alto'] as const;
export const ESTADOS_CREDITO_CLIENTE = [
  'sin_solicitud',
  'pendiente_aprobacion',
  'aprobado',
  'rechazado',
] as const;

export type PlazoCreditoDias = (typeof PLAZOS_CREDITO_DIAS)[number];
export type NivelRiesgoCredito = (typeof NIVELES_RIESGO_CREDITO)[number];
export type EstadoCreditoCliente = (typeof ESTADOS_CREDITO_CLIENTE)[number];

/** Un campo opcional enviado como "" se trata como "no enviado". */
const vacioAUndefined = (valor: unknown) =>
  typeof valor === 'string' && valor.trim() === '' ? undefined : valor;

const numeroOpcional = (valor: unknown) => {
  if (valor === '' || valor === null || valor === undefined) return undefined;
  const parsed = Number(valor);
  return Number.isNaN(parsed) ? valor : parsed;
};

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
    // Apartado de evaluación financiera para crédito corporativo B2B
    solicitarCredito: z.boolean().optional(),
    gananciaNetaMensual: z.preprocess(
      numeroOpcional,
      z.number().positive({ message: 'La ganancia neta mensual debe ser mayor a 0.' }).max(999_999_999_999).optional(),
    ),
    antiguedadEmpresaMeses: z.preprocess(
      numeroOpcional,
      z.number().int().min(0, { message: 'La antigüedad no puede ser negativa.' }).max(1200).optional(),
    ),
    plazoCreditoDias: z.preprocess(
      numeroOpcional,
      z
        .number()
        .int()
        .refine((v): v is PlazoCreditoDias => (PLAZOS_CREDITO_DIAS as readonly number[]).includes(v), {
          message: 'El plazo de crédito debe ser 15, 30, 45 o 60 días.',
        })
        .optional(),
    ),
    observacionFinanciera: z.preprocess(
      vacioAUndefined,
      z.string().trim().max(500, { message: 'La observación financiera no puede exceder 500 caracteres.' }).optional(),
    ),
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
      if (datos.solicitarCredito && (datos.gananciaNetaMensual === undefined || datos.gananciaNetaMensual <= 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['gananciaNetaMensual'],
          message: 'Debes ingresar la ganancia neta mensual de la empresa para evaluar el crédito.',
        });
      }
    }
  });

export const simularCreditoB2BSchema = z.object({
  gananciaNetaMensual: z.coerce
    .number({ required_error: 'La ganancia neta mensual es obligatoria.' })
    .positive({ message: 'La ganancia neta mensual debe ser mayor a 0.' })
    .max(999_999_999_999),
  antiguedadEmpresaMeses: z.preprocess(
    numeroOpcional,
    z.number().int().min(0).max(1200).optional(),
  ),
  plazoCreditoDias: z.preprocess(
    numeroOpcional,
    z
      .number()
      .int()
      .refine((v): v is PlazoCreditoDias => (PLAZOS_CREDITO_DIAS as readonly number[]).includes(v), {
        message: 'El plazo de crédito debe ser 15, 30, 45 o 60 días.',
      })
      .optional(),
  ),
});

export const decidirCreditoClienteSchema = z
  .object({
    decision: z.enum(['aprobar', 'rechazar'], {
      message: 'La decisión debe ser aprobar o rechazar.',
    }),
    cupoAprobado: z.preprocess(
      numeroOpcional,
      z.number().min(0, { message: 'El cupo aprobado no puede ser negativo.' }).max(999_999_999_999).optional(),
    ),
    plazoCreditoDias: z.preprocess(
      numeroOpcional,
      z
        .number()
        .int()
        .refine((v): v is PlazoCreditoDias => (PLAZOS_CREDITO_DIAS as readonly number[]).includes(v), {
          message: 'El plazo de crédito debe ser 15, 30, 45 o 60 días.',
        })
        .optional(),
    ),
    motivo: z.preprocess(
      vacioAUndefined,
      z.string().trim().min(5, { message: 'El motivo debe tener al menos 5 caracteres.' }).max(255).optional(),
    ),
  })
  .superRefine((datos, ctx) => {
    if (datos.decision === 'aprobar' && (datos.cupoAprobado === undefined || datos.cupoAprobado <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cupoAprobado'],
        message: 'Al aprobar el crédito debes indicar un cupo aprobado mayor a 0.',
      });
    }
    if (datos.decision === 'rechazar' && !datos.motivo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['motivo'],
        message: 'Debes indicar el motivo del rechazo del crédito.',
      });
    }
  });

// Vienen por query string, por eso coerce (igual que filtrosUsuariosSchema)
export const filtrosClientesSchema = z.object({
  texto: z.string().trim().max(100).optional(),
  tipoDocumento: z.enum(TIPOS_DOCUMENTO_CLIENTE).optional(),
  limite: z.coerce.number().int().min(1).max(50).default(20),
});

export interface EvaluacionCreditoB2BDto {
  gananciaNetaMensual: number;
  antiguedadEmpresaMeses: number | null;
  plazoCreditoDias: PlazoCreditoDias;
  factorAntiguedad: number;
  factorPlazo: number;
  cupoBaseCalculado: number;
  cupoSugerido: number;
  topePoliticaAplicado: number;
  nivelRiesgo: NivelRiesgoCredito;
  viable: boolean;
  justificacion: string;
}

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
  gananciaNetaMensual?: number | null;
  antiguedadEmpresaMeses?: number | null;
  plazoCreditoDias?: number | null;
  cupoCreditoSugerido?: number;
  cupoCreditoAprobado?: number;
  cupoCreditoUtilizado?: number;
  cupoCreditoDisponible?: number;
  nivelRiesgoCredito?: NivelRiesgoCredito | null;
  estadoCredito?: EstadoCreditoCliente;
  creditoAprobadoPor?: string | null;
  creditoAprobadoEn?: string | null;
  motivoDecisionCredito?: string | null;
  observacionFinanciera?: string | null;
}

export const actualizarClienteSchema = z.object({
  nombreRazonSocial: z
    .string()
    .trim()
    .min(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
    .max(200)
    .optional(),
  email: z.preprocess(
    vacioAUndefined,
    z.string().trim().email({ message: 'Ingresa un correo válido.' }).max(150).optional(),
  ),
  telefono: z.preprocess(vacioAUndefined, z.string().trim().min(7).max(30).optional()),
  direccion: z.preprocess(vacioAUndefined, z.string().trim().min(5).max(255).optional()),
  creditoHabilitado: z.boolean().optional(),
});

export type CrearClienteInput = z.infer<typeof crearClienteSchema>;
export type ActualizarClienteInput = z.infer<typeof actualizarClienteSchema>;
export type FiltrosClientesInput = z.infer<typeof filtrosClientesSchema>;
export type SimularCreditoB2BInput = z.infer<typeof simularCreditoB2BSchema>;
export type DecidirCreditoClienteInput = z.infer<typeof decidirCreditoClienteSchema>;
