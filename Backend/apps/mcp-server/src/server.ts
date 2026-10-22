import http from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import type { AppContainer } from '@warengine/composition';
import {
  McpSessionContext,
  SessionManager,
  validarSesionJwtMcp,
} from './session/index.ts';
import {
  registrarCatalogoEnMcpServer,
  obtenerCatalogoCompleto,
  obtenerToolsAutorizadasParaUsuario,
} from './catalog/index.ts';
import { McpAuthorizationGateway } from './gateway/index.ts';
import { inicializarCatalogoTools } from './tools/index.ts';

export interface McpServerConfig {
  port: number;
  host: string;
  corsOrigenes?: string;
}

/**
 * Aplica cabeceras de Cross-Origin Resource Sharing (CORS) a la respuesta HTTP.
 */
function aplicarCors(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  config: McpServerConfig,
): boolean {
  const origin = req.headers['origin'] || '*';
  const origenesPermitidos = config.corsOrigenes
    ? config.corsOrigenes.split(',').map((o) => o.trim())
    : ['*'];

  const originHeader =
    origenesPermitidos.includes('*') || origenesPermitidos.includes(origin)
      ? origin
      : origenesPermitidos[0];

  res.setHeader('Access-Control-Allow-Origin', originHeader);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true; // Petición pre-flight resuelta
  }

  return false;
}

/**
 * Crea una instancia dedicada de McpServer para la sesión del usuario.
 * Garantiza aislamiento y permite registrar únicamente las Tools autorizadas
 * para su rol y permisos (RF-SA-I1).
 */
export function crearMcpServerParaSesion(
  container: AppContainer,
  sessionContext: McpSessionContext,
): McpServer {
  const server = new McpServer({
    name: 'warengine-mcp-server',
    version: '1.0.0',
  });

  // Registra dinámicamente solo las Tools autorizadas para este usuario (RF-SA-I1)
  registrarCatalogoEnMcpServer(server, container, sessionContext);

  return server;
}

/**
 * Crea e inicializa el servidor HTTP con soporte para Server-Sent Events (SSE)
 * y mensajes JSON-RPC del estándar Model Context Protocol (RF-SA-I2).
 */
export function createMcpHttpServer(
  container: AppContainer,
  config: McpServerConfig,
): http.Server {
  // Asegura que todas las Tools oficiales estén registradas en el catálogo global
  inicializarCatalogoTools();

  const sessionManager = new SessionManager();

  const server = http.createServer(async (req, res) => {
    // 1. Manejo de cabeceras CORS
    if (aplicarCors(req, res, config)) {
      return;
    }

    const host = req.headers['host'] || `localhost:${config.port}`;
    const url = new URL(req.url || '/', `http://${host}`);

    // 2. Ruta de Verificación de Salud (Health Check)
    if (url.pathname === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          servidor: 'warengine-mcp-server',
          sesionesActivas: sessionManager.cantidadSesionesActivas,
          fecha: new Date().toISOString(),
        }),
      );
      return;
    }

    // 3. Ruta de conexión SSE (/sse) — Establece canal unidireccional servidor -> cliente
    if (url.pathname === '/sse' && req.method === 'GET') {
      try {
        // Valida token JWT y resuelve alcance antes de abrir el canal
        const sesionResult = await validarSesionJwtMcp(req, '', container);

        if (sesionResult.isFailure) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: sesionResult.error.code,
              message: sesionResult.error.message,
            }),
          );
          return;
        }

        const sessionContext = sesionResult.value;

        // Instancia el transporte SSE oficial de MCP indicando el endpoint de mensajes POST
        const transport = new SSEServerTransport('/message', res);
        sessionContext.sessionId = transport.sessionId;

        // Registra la sesión activa en el gestor en memoria
        sessionManager.registrar(transport.sessionId, sessionContext, transport);

        // Limpia la sesión cuando el cliente se desconecta
        res.on('close', () => {
          sessionManager.remover(transport.sessionId);
        });

        // Crea el servidor MCP personalizado para este usuario y conecta el transporte
        const mcpInstance = crearMcpServerParaSesion(container, sessionContext);
        await mcpInstance.connect(transport);
      } catch (error) {
        console.error('[MCP-SSE-ERROR] Error al inicializar conexión SSE:', error);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'ERROR_CONEXION_SSE', message: 'No se pudo iniciar el canal SSE.' }));
        }
      }
      return;
    }

    // 4. Ruta de recepción de mensajes (/message) — Procesa peticiones RPC enviadas por el cliente
    if (url.pathname === '/message' && req.method === 'POST') {
      const sessionId = url.searchParams.get('sessionId');

      if (!sessionId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'SESSION_ID_REQUERIDO',
            message: "Debe incluir el parámetro 'sessionId' en la URL.",
          }),
        );
        return;
      }

      const sesionActiva = sessionManager.obtener(sessionId);

      if (!sesionActiva) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'SESION_NO_ENCONTRADA',
            message: 'No existe una sesión SSE activa para el ID provisto o ha expirado.',
          }),
        );
        return;
      }

      try {
        await sesionActiva.transport.handlePostMessage(req, res);
      } catch (error) {
        console.error('[MCP-POST-ERROR] Error al procesar mensaje POST:', error);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'ERROR_MENSAJE_MCP', message: 'Fallo al procesar mensaje RPC.' }));
        }
      }
      return;
    }

    // 5. Ruta de consulta de catálogo de herramientas (/tools) — REST HTTP para clientes directos y Gemini
    if (url.pathname === '/tools' && req.method === 'GET') {
      try {
        const sesionResult = await validarSesionJwtMcp(req, '', container);
        if (sesionResult.isFailure) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: sesionResult.error.code, message: sesionResult.error.message }));
          return;
        }

        const sessionContext = sesionResult.value;
        const toolsAutorizadas = obtenerToolsAutorizadasParaUsuario(sessionContext);

        const toolsResponse = toolsAutorizadas.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.shape
            ? {
                type: 'object',
                properties: Object.fromEntries(
                  Object.entries(t.shape).map(([k, v]) => {
                    const typeName = (v as { _def?: { typeName?: string } })?._def?.typeName;
                    const isNumber =
                      typeName === 'ZodNumber' ||
                      k.toLowerCase().endsWith('id') ||
                      k.toLowerCase().includes('precio') ||
                      k.toLowerCase().includes('cantidad');
                    return [
                      k,
                      {
                        type: isNumber ? 'number' : 'string',
                        description: (v as { description?: string })?.description || '',
                      },
                    ];
                  }),
                ),
              }
            : undefined,
        }));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ tools: toolsResponse }));
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'ERROR_LISTAR_TOOLS', message: msg }));
      }
      return;
    }

    // 6. Ruta de ejecución directa de herramientas (/execute) — REST HTTP para orquestador LLM y Swagger
    if (url.pathname === '/execute' && req.method === 'POST') {
      try {
        const sesionResult = await validarSesionJwtMcp(req, '', container);
        if (sesionResult.isFailure) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: sesionResult.error.code, message: sesionResult.error.message }));
          return;
        }

        const sessionContext = sesionResult.value;
        const chunks: Uint8Array[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk);
        }
        const bodyRaw = new TextDecoder().decode(
          chunks.reduce((acc, c) => {
            const merged = new Uint8Array(acc.length + c.length);
            merged.set(acc);
            merged.set(c, acc.length);
            return merged;
          }, new Uint8Array(0)),
        );

        const body = JSON.parse(bodyRaw || '{}');
        const { tool: toolName, arguments: toolArgs } = body;

        const catalogo = obtenerCatalogoCompleto();
        const toolDef = catalogo.find((t) => t.name === toolName);

        if (!toolDef) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'TOOL_NO_ENCONTRADA', message: `La herramienta '${toolName}' no está registrada.` }));
          return;
        }

        const resultado = await McpAuthorizationGateway.procesarTool({
          toolName: toolDef.name,
          permisoRequerido: toolDef.permisoRequerido,
          schema: toolDef.schema,
          args: (toolArgs as Record<string, unknown>) || {},
          sessionContext,
          container,
          handler: (argsValidados, ctx) => toolDef.handler(argsValidados, container, ctx),
          formateador: toolDef.formateador,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(resultado));
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'ERROR_EJECUTAR_TOOL', message: msg }));
      }
      return;
    }

    // 7. Ruta no encontrada
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'RUTA_NO_ENCONTRADA',
        message: 'La ruta solicitada no existe en el servidor MCP de Warengine.',
      }),
    );
  });

  return server;
}
