export interface EventoAuditoria {
  usuarioId?: string | null;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  detalles?: Record<string, unknown> | null;
  ip?: string | null;
  fecha?: Date;
}

export interface IAuditoriaService {
  registrar(evento: EventoAuditoria): Promise<void>;
}
