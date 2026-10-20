/**
 * session.types.ts — Tipos y estructuras para la gestión de sesiones en el servidor MCP.
 *
 * Cada conexión SSE que se establece representa una sesión autenticada vinculada
 * a un token JWT de Warengine, garantizando trazabilidad y RBAC inmutable.
 */

export interface McpSessionContext {
  /** Identificador único UUID del usuario autenticado */
  usuarioId: string;

  /** Identificador del rol asignado al usuario en base de datos */
  rolId: number;

  /**
   * Sucursal activa del usuario. Si el usuario tiene alcance limitado,
   * toda consulta se forzará automáticamente a esta sucursal (RF-SA-I4).
   */
  sucursalId: number | null;

  /** Lista de sucursales permitidas para este usuario (undefined si tiene alcance global) */
  sucursalesPermitidas?: number[];

  /** Indica si el usuario tiene acceso global a todas las sedes (SuperAdmin) */
  esGlobal: boolean;

  /** Lista de códigos de permisos activos del usuario leídos en tiempo real de la BD */
  permisos: string[];

  /** Identificador único de la sesión de transporte SSE generado por el SDK de MCP */
  sessionId: string;

  /** Marca temporal del momento en que se estableció la conexión SSE */
  createdAt: Date;
}
