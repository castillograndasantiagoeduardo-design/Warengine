/**
 * LogMcpTool.ts — Entidad de Dominio para el registro de auditoría del servidor MCP.
 * Representa la telemetría y trazabilidad forense de cada herramienta invocada
 * por modelos de lenguaje o asistentes conversacionales (RF-SA-I9).
 */

export interface LogMcpToolProps {
  id?: number;
  toolName: string;
  usuarioId: string | null;
  usuarioNombre?: string | null;
  sucursalId: number | null;
  sucursalNombre?: string | null;
  parametros: Record<string, unknown> | null;
  exitoso: boolean;
  duracionMs: number;
  error?: string | null;
  fecha?: Date;
}

export class LogMcpTool {
  constructor(public readonly props: LogMcpToolProps) {}

  /** ID numérico autoincremental de la entrada de log */
  get id(): number | undefined {
    return this.props.id;
  }

  /** Nombre oficial de la herramienta MCP ejecutada (ej. 'consulta-stock') */
  get toolName(): string {
    return this.props.toolName;
  }

  /** Identificador UUID del usuario en sesión que invocó la Tool */
  get usuarioId(): string | null {
    return this.props.usuarioId;
  }

  /** Nombre de pila del usuario para visualización en reportes */
  get usuarioNombre(): string | null | undefined {
    return this.props.usuarioNombre;
  }

  /** ID de la sucursal activa en el contexto del usuario */
  get sucursalId(): number | null {
    return this.props.sucursalId;
  }

  /** Nombre de la sucursal para enriquecer la lectura de auditoría */
  get sucursalNombre(): string | null | undefined {
    return this.props.sucursalNombre;
  }

  /** Parámetros JSON sanitizados enviados por el LLM */
  get parametros(): Record<string, unknown> | null {
    return this.props.parametros;
  }

  /** Indica si la Tool completó con Result.ok (true) o si fue denegada/falló (false) */
  get exitoso(): boolean {
    return this.props.exitoso;
  }

  /** Latencia total de ejecución medida en milisegundos */
  get duracionMs(): number {
    return this.props.duracionMs;
  }

  /** Mensaje o código de error en caso de fallo (ej. 'PERMISO_DENEGADO') */
  get error(): string | null | undefined {
    return this.props.error;
  }

  /** Marca temporal de creación del registro en base de datos */
  get fecha(): Date | undefined {
    return this.props.fecha;
  }
}
