import { Result } from '@warengine/shared-kernel';
import { ILogMcpToolRepository, RegistroLogMcpTool } from '../ports/ILogMcpToolRepository.ts';
import { sanitizarDetalles } from '../../../auditoria/domain/services/sanitizar-detalles.ts';

/**
 * Caso de Uso: RegistrarLogMcpToolUseCase
 *
 * Responsabilidad:
 * Registra de forma segura e inmutable la telemetría de una Tool invocada
 * en el servidor MCP (RF-SA-I9). Sanitiza los argumentos para evitar fugas
 * de tokens o datos sensibles y delega la persistencia al repositorio.
 */
export class RegistrarLogMcpToolUseCase {
  constructor(private readonly logMcpToolRepository: ILogMcpToolRepository) {}

  /**
   * Ejecuta el registro del log de la Tool.
   * Por diseño resiliente de auditoría, las fallas de persistencia no
   * interrumpen la respuesta de la Tool al usuario, pero se emiten a la consola.
   */
  public async execute(input: RegistroLogMcpTool): Promise<Result<void, never>> {
    try {
      const parametrosSanitizados = sanitizarDetalles(input.parametros);

      await this.logMcpToolRepository.registrar({
        toolName: input.toolName,
        usuarioId: input.usuarioId,
        sucursalId: input.sucursalId,
        parametros: parametrosSanitizados,
        exitoso: input.exitoso,
        duracionMs: input.duracionMs,
        error: input.error ?? null,
      });

      return Result.ok(undefined);
    } catch (error) {
      console.error(
        `[MCP-AUDIT-ERROR] Error al registrar telemetría de tool=${input.toolName} usuario=${input.usuarioId}:`,
        error,
      );
      return Result.ok(undefined);
    }
  }
}
