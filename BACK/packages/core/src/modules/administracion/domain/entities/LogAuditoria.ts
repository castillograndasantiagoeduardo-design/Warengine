/** Acciones estándar del log de auditoría. Los demás módulos deben reutilizarlas. */
export const ACCIONES_AUDITORIA = {
  CREAR: 'crear',
  EDITAR: 'editar',
  ACTIVAR: 'activar',
  INACTIVAR: 'inactivar',
  CAMBIAR_ROL: 'cambiar_rol',
} as const;

/** Nombres de entidad (coinciden con la tabla afectada). Se agregan al sumar módulos. */
export const ENTIDADES_AUDITORIA = {
  SUCURSALES: 'sucursales',
  USUARIOS: 'usuarios',
} as const;

/** Quién ejecuta la operación y desde dónde. Lo arma la capa HTTP a partir del token. */
export interface ActorAuditoria {
  usuarioId: string;
  ip: string | null;
}

/** Modelo de lectura de un registro de auditoría. */
export class LogAuditoria {
  constructor(
    public readonly id: string,
    public readonly usuarioId: string | null,
    public readonly usuarioNombre: string | null,
    public readonly accion: string,
    public readonly entidad: string,
    public readonly entidadId: string | null,
    public readonly detalles: Record<string, unknown> | null,
    public readonly ip: string | null,
    public readonly fecha: Date,
  ) {}
}