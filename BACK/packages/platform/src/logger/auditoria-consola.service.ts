import { EventoAuditoria, IAuditoriaService } from '@warengine/core';

/**
 * AuditoriaConsolaService — Implementación temporal para RNF-ADM-02
 * Registra eventos de auditoría en log estructurado mientras se conecta
 * la infraestructura de persistencia completa de la tabla `logs_auditoria`.
 */
export class AuditoriaConsolaService implements IAuditoriaService {
  public async registrar(evento: EventoAuditoria): Promise<void> {
    const timestamp = evento.fecha ? evento.fecha.toISOString() : new Date().toISOString();
    console.log(
      `[AUDITORIA] [${timestamp}] Usuario: ${evento.usuarioId ?? 'SISTEMA'} | Acción: ${evento.accion} | Entidad: ${evento.entidad} | EntidadId: ${evento.entidadId ?? 'N/A'}`
    );
  }
}
