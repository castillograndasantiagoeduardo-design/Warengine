import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AppContainer } from '@warengine/composition';
import type { McpSessionContext } from '../session/index.ts';
import { McpAuthorizationGateway } from '../gateway/index.ts';
import type { DefinicionToolMcp } from './tool-definition.ts';

/**
 * Registro en memoria de todas las herramientas definidas en la aplicación.
 */
const CATALOGO_GLOBAL_TOOLS: DefinicionToolMcp[] = [];

/**
 * Registra una nueva herramienta en el catálogo global del sistema.
 */
export function registrarToolEnCatalogo(definicion: DefinicionToolMcp): void {
  const existe = CATALOGO_GLOBAL_TOOLS.some((t) => t.name === definicion.name);
  if (!existe) {
    CATALOGO_GLOBAL_TOOLS.push(definicion);
  }
}

/**
 * Filtra el catálogo de Tools exponiendo ÚNICAMENTE el subconjunto de herramientas
 * autorizadas para los permisos activos del usuario (RF-SA-I1 / RF-SA-I5).
 */
export function obtenerToolsAutorizadasParaUsuario(
  sessionContext: McpSessionContext,
): DefinicionToolMcp[] {
  return CATALOGO_GLOBAL_TOOLS.filter((tool) =>
    sessionContext.permisos.includes(tool.permisoRequerido),
  );
}

/**
 * Registra en una instancia de McpServer únicamente las herramientas a las que
 * el usuario tiene acceso, vinculándolas al McpAuthorizationGateway.
 */
export function registrarCatalogoEnMcpServer(
  server: McpServer,
  container: AppContainer,
  sessionContext: McpSessionContext,
): void {
  const toolsAutorizadas = obtenerToolsAutorizadasParaUsuario(sessionContext);

  for (const tool of toolsAutorizadas) {
    server.tool(
      tool.name,
      tool.description,
      tool.shape ?? {},
      async (args: any) => {
        return await McpAuthorizationGateway.procesarTool({
          toolName: tool.name,
          permisoRequerido: tool.permisoRequerido,
          schema: tool.schema,
          args,
          sessionContext,
          container,
          handler: (argsValidados, ctx) => tool.handler(argsValidados, container, ctx),
          formateador: tool.formateador,
        });
      },
    );
  }
}

/**
 * Retorna la lista completa de tools registradas (útil para auditoría y testing).
 */
export function obtenerCatalogoCompleto(): readonly DefinicionToolMcp[] {
  return CATALOGO_GLOBAL_TOOLS;
}
