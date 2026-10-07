import { and, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { empleados } from '../../schema/administracion.schema.ts';
import { usuarios } from '../../schema/autenticacion.schema.ts';
import { logs_auditoria } from '../../schema/auditoria.schema.ts';
import {
  EventoAuditoria,
  FiltrosAuditoria,
  IAuditoriaRepository,
  PaginaAuditoria,
  sanitizarDetalles,
} from '@warengine/core';
import { logAuditoriaFromRow } from '../../mappers/administracion/log-auditoria.mapper.ts';

export class DrizzleAuditoriaRepository implements IAuditoriaRepository {
  constructor(private readonly db: Database) {}

  /**
   * Inserta una fila de auditoría. Si falla, NO tumba la operación de negocio que ya se
   * completó: deja el error en la consola del servidor. (Nunca se imprimen los detalles.)
   */
  public async registrar(evento: EventoAuditoria): Promise<void> {
    try {
      const detallesSanitizados = sanitizarDetalles(evento.detalles);
      await this.db.insert(logs_auditoria).values({
        usuario_id: evento.actor.usuarioId,
        accion: evento.accion,
        entidad: evento.entidad,
        entidad_id: evento.entidadId ?? null,
        detalles: detallesSanitizados ?? null,
        ip: evento.actor.ip,
      });
    } catch (error) {
      console.error(
        `[auditoria] No se pudo registrar accion=${evento.accion} entidad=${evento.entidad} entidadId=${evento.entidadId ?? 'null'} usuarioId=${evento.actor.usuarioId}:`,
        error,
      );
    }
  }

  public async listar(filtros: FiltrosAuditoria): Promise<PaginaAuditoria> {
    const condiciones: SQL[] = [];
    if (filtros.usuarioId) condiciones.push(eq(logs_auditoria.usuario_id, filtros.usuarioId));
    if (filtros.accion) condiciones.push(eq(logs_auditoria.accion, filtros.accion));
    if (filtros.entidad) condiciones.push(eq(logs_auditoria.entidad, filtros.entidad));
    if (filtros.desde) condiciones.push(gte(logs_auditoria.fecha, filtros.desde));
    if (filtros.hasta) condiciones.push(lte(logs_auditoria.fecha, filtros.hasta));
    const where = condiciones.length > 0 ? and(...condiciones) : undefined;

    const rows = await this.db
      .select({
        id: logs_auditoria.id_log_auditoria,
        usuarioId: logs_auditoria.usuario_id,
        usuarioNombre: empleados.nombre,
        accion: logs_auditoria.accion,
        entidad: logs_auditoria.entidad,
        entidadId: logs_auditoria.entidad_id,
        detalles: logs_auditoria.detalles,
        ip: logs_auditoria.ip,
        fecha: logs_auditoria.fecha,
      })
      .from(logs_auditoria)
      .leftJoin(usuarios, eq(logs_auditoria.usuario_id, usuarios.id_usuario))
      .leftJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
      .where(where)
      .orderBy(desc(logs_auditoria.fecha), desc(logs_auditoria.id_log_auditoria))
      .limit(filtros.limite)
      .offset(filtros.offset);

    const [fila] = await this.db.select({ total: count() }).from(logs_auditoria).where(where);

    return { items: rows.map(logAuditoriaFromRow), total: Number(fila?.total ?? 0) };
  }
}