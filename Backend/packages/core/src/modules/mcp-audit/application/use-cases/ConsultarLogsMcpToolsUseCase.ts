import { Result } from '@warengine/shared-kernel';
import {
  FiltrosLogsMcpTools,
  ILogMcpToolRepository,
  PaginaLogsMcpTools,
} from '../ports/ILogMcpToolRepository.ts';

/**
 * Caso de Uso: ConsultarLogsMcpToolsUseCase
 *
 * Responsabilidad:
 * Permite consultar la bitácora histórica de ejecuciones de herramientas MCP,
 * filtrando por usuario, nombre de tool, estado (éxito/error) o rango de fechas.
 */
export class ConsultarLogsMcpToolsUseCase {
  constructor(private readonly logMcpToolRepository: ILogMcpToolRepository) {}

  public async execute(filtros: FiltrosLogsMcpTools): Promise<Result<PaginaLogsMcpTools, never>> {
    const pagina = await this.logMcpToolRepository.listar(filtros);
    return Result.ok(pagina);
  }
}
