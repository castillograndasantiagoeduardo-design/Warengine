import type { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import type { McpSessionContext } from './session.types.ts';

export interface SesionActiva {
  contexto: McpSessionContext;
  transport: SSEServerTransport;
}

/**
 * SessionManager — Registro central de conexiones y sesiones activas en el servidor MCP.
 *
 * Mantiene en memoria el estado de cada transporte SSE abierto y su respectivo
 * contexto de usuario, facilitando la auditoría y la autorización en cada mensaje POST.
 */
export class SessionManager {
  private readonly sesiones = new Map<string, SesionActiva>();

  /**
   * Registra una nueva sesión activa asociándola a su ID de transporte.
   */
  public registrar(sessionId: string, contexto: McpSessionContext, transport: SSEServerTransport): void {
    this.sesiones.set(sessionId, { contexto, transport });
  }

  /**
   * Obtiene la sesión activa mediante su sessionId.
   */
  public obtener(sessionId: string): SesionActiva | undefined {
    return this.sesiones.get(sessionId);
  }

  /**
   * Obtiene exclusivamente el contexto de seguridad de la sesión.
   */
  public obtenerContexto(sessionId: string): McpSessionContext | undefined {
    return this.sesiones.get(sessionId)?.contexto;
  }

  /**
   * Remueve una sesión cuando la conexión SSE se cierra o finaliza.
   */
  public remover(sessionId: string): boolean {
    return this.sesiones.delete(sessionId);
  }

  /**
   * Retorna la cantidad de sesiones concurrentes activas en el servidor.
   */
  public get cantidadSesionesActivas(): number {
    return this.sesiones.size;
  }
}
