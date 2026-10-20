import { z } from 'zod';
import { DomainError, Result } from '@warengine/shared-kernel';
import type { AppContainer } from '@warengine/composition';
import type { McpSessionContext } from '../session/index.ts';

/**
 * Definición abstracta de una Tool del servidor MCP en Warengine.
 */
export interface DefinicionToolMcp<TArgs = any, TResult = any> {
  /** Nombre oficial en kebab-case de la Tool (ej. 'consulta-stock') */
  name: string;

  /** Descripción semántica para que el modelo de IA comprenda cuándo utilizarla */
  description: string;

  /** Código del permiso RBAC requerido para poder ver y ejecutar la Tool */
  permisoRequerido: string;

  /** Esquema Zod de validación de los argumentos de entrada */
  schema?: z.ZodType<TArgs>;

  /**
   * Forma desglosada del esquema Zod para registrar en el McpServer del SDK.
   * Si no se provee, se toma un objeto vacío.
   */
  shape?: Record<string, z.ZodTypeAny>;

  /** Función que delega la ejecución al caso de uso correspondiente del Core */
  handler: (
    args: TArgs,
    container: AppContainer,
    sessionContext: McpSessionContext,
  ) => Promise<Result<TResult, DomainError>>;

  /** Formateador opcional para estructurar la respuesta en Markdown o texto */
  formateador?: (resultado: TResult) => string;
}
