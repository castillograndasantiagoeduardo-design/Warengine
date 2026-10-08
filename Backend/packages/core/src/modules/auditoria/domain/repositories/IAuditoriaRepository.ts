import { ActorAuditoria, LogAuditoria } from '../entities/LogAuditoria.ts';

export interface EventoAuditoria {
  actor: ActorAuditoria;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  /** Datos útiles para reconstruir qué pasó. NUNCA contraseñas, hashes ni tokens. */
  detalles?: Record<string, unknown> | null;
}

/** Puerto mínimo para los casos de uso que solo necesitan registrar (ISP). */
export interface IAuditor {
  registrar(evento: EventoAuditoria): Promise<void>;
}

export interface FiltrosAuditoria {
  usuarioId?: string;
  accion?: string;
  entidad?: string;
  desde?: Date;
  hasta?: Date;
  limite: number;
  offset: number;
}

export interface PaginaAuditoria {
  items: LogAuditoria[];
  total: number;
}

export interface IAuditoriaRepository extends IAuditor {
  listar(filtros: FiltrosAuditoria): Promise<PaginaAuditoria>;
}
 