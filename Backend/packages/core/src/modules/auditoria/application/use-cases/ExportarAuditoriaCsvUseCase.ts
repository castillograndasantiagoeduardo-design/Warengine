import { DomainError, Result } from '@warengine/shared-kernel';
import { IAuditoriaRepository } from '../../domain/repositories/IAuditoriaRepository.ts';
import { FiltroAuditoriaInvalidoError } from '../../domain/errors/AuditoriaErrors.ts';
import { generarCsv } from '../../../inventario/application/utils/csv-generator.ts';

export interface ExportarAuditoriaCsvRequest {
  usuarioId?: string;
  accion?: string;
  entidad?: string;
  entidadId?: string;
  desde?: Date;
  hasta?: Date;
  limite?: number;
}

export interface ExportarAuditoriaCsvResult {
  csv: string;
  total: number;
  nombreArchivo: string;
}

export type ExportarAuditoriaCsvResponse = Result<ExportarAuditoriaCsvResult, DomainError>;

/**
 * RF-ADM-C20: Exportación de registros de auditoría a CSV / Excel.
 * Permite exportar los eventos filtrados por usuario, entidad, acción y fechas.
 */
export class ExportarAuditoriaCsvUseCase {
  constructor(private readonly auditoriaRepository: IAuditoriaRepository) {}

  public async execute(
    request: ExportarAuditoriaCsvRequest = {},
  ): Promise<ExportarAuditoriaCsvResponse> {
    if (request.desde && request.hasta && request.desde > request.hasta) {
      return Result.fail(
        new FiltroAuditoriaInvalidoError('La fecha "desde" no puede ser posterior a "hasta".'),
      );
    }

    const limite = Math.min(
      50000,
      Math.max(1, Math.floor(request.limite ?? 10000)),
    );

    const { items } = await this.auditoriaRepository.listar({
      usuarioId: request.usuarioId,
      accion: request.accion,
      entidad: request.entidad,
      entidadId: request.entidadId,
      desde: request.desde,
      hasta: request.hasta,
      limite,
      offset: 0,
    });

    const encabezados = [
      'ID_Log',
      'Fecha',
      'Usuario_ID',
      'Usuario_Nombre',
      'Accion',
      'Entidad',
      'Entidad_ID',
      'IP',
      'Detalles',
    ];

    const filas = items.map((item) => [
      item.id,
      item.fecha instanceof Date ? item.fecha.toISOString() : String(item.fecha ?? ''),
      item.usuarioId ?? '',
      item.usuarioNombre ?? '',
      item.accion,
      item.entidad,
      item.entidadId ?? '',
      item.ip ?? '',
      item.detalles ? JSON.stringify(item.detalles) : '',
    ]);

    const csv = generarCsv(encabezados, filas);
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const nombreArchivo = `auditoria_export_${timestamp}.csv`;

    return Result.ok({
      csv,
      total: items.length,
      nombreArchivo,
    });
  }
}
