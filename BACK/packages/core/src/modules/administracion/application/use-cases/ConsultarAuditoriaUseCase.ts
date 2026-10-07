import { Result, DomainError } from '@warengine/shared-kernel';
import { IAuditoriaRepository } from '../../domain/repositories/IAuditoriaRepository.ts';
import { LogAuditoria } from '../../domain/entities/LogAuditoria.ts';
import { FiltroAuditoriaInvalidoError } from '../../domain/errors/AdministracionErrors.ts';

const LIMITE_POR_DEFECTO = 50;
const LIMITE_MAXIMO = 200;

export interface ConsultarAuditoriaRequest {
  usuarioId?: string;
  accion?: string;
  entidad?: string;
  desde?: Date;
  hasta?: Date;
  pagina?: number;
  limite?: number;
}

export interface PaginaAuditoriaResponse {
  items: LogAuditoria[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export type ConsultarAuditoriaResponse = Result<PaginaAuditoriaResponse, DomainError>;

/** RF-ADM-C11: listado consultable de la auditoría, filtrable por usuario, fecha y acción. */
export class ConsultarAuditoriaUseCase {
  constructor(private readonly auditoriaRepository: IAuditoriaRepository) {}

  public async execute(request: ConsultarAuditoriaRequest = {}): Promise<ConsultarAuditoriaResponse> {
    if (request.desde && request.hasta && request.desde > request.hasta) {
      return Result.fail(
        new FiltroAuditoriaInvalidoError('La fecha "desde" no puede ser posterior a "hasta".'),
      );
    }

    const pagina = Math.max(1, Math.floor(request.pagina ?? 1));
    const limite = Math.min(
      LIMITE_MAXIMO,
      Math.max(1, Math.floor(request.limite ?? LIMITE_POR_DEFECTO)),
    );

    const { items, total } = await this.auditoriaRepository.listar({
      usuarioId: request.usuarioId,
      accion: request.accion,
      entidad: request.entidad,
      desde: request.desde,
      hasta: request.hasta,
      limite,
      offset: (pagina - 1) * limite,
    });

    return Result.ok({ items, total, pagina, limite, totalPaginas: Math.ceil(total / limite) });
  }
}