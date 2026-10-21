import { GoogleGenerativeAI } from '@google/generative-ai';
import { DomainError, Result } from '@warengine/shared-kernel';
import {
  type IAsistenteService,
  type PeticionAsistenteInput,
  type RespuestaAsistenteOutput,
  ErrorComunicacionAsistenteError,
} from '@warengine/core';

export interface GeminiAsistenteConfig {
  apiKey?: string;
  modelName?: string;
  mcpServerUrl?: string;
}

export interface McpToolDeclaration {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
}

export type ToolExecutorFn = (
  toolName: string,
  args: Record<string, unknown>,
  tokenJwt: string,
) => Promise<string>;

export type ToolListerFn = (tokenJwt: string) => Promise<McpToolDeclaration[]>;

/**
 * GeminiAsistenteService — Orquestador de IA conversacional impulsado por Google Gemini (RF-SA-i1 / RF-SA-i2).
 *
 * Flujo de ejecución:
 *  1. Obtiene las Tools autorizadas para el usuario desde el catálogo MCP.
 *  2. Convierte los esquemas de las Tools a Function Declarations compatibles con Gemini.
 *  3. Inicia la conversación con el historial y envía el mensaje del usuario al modelo.
 *  4. Si Gemini solicita invocar una Tool, la ejecuta a través del servidor MCP con la sesión del usuario.
 *  5. Retorna la respuesta de la Tool al modelo para que elabore su respuesta final en lenguaje natural.
 */
export class GeminiAsistenteService implements IAsistenteService {
  private readonly apiKey?: string;
  private readonly modelName: string;
  private readonly mcpServerUrl: string;
  private readonly customToolLister?: ToolListerFn;
  private readonly customToolExecutor?: ToolExecutorFn;

  constructor(
    config: GeminiAsistenteConfig = {},
    customToolLister?: ToolListerFn,
    customToolExecutor?: ToolExecutorFn,
  ) {
    this.apiKey = config.apiKey || Deno.env.get('GEMINI_API_KEY');
    this.modelName = config.modelName || Deno.env.get('GEMINI_MODEL') || 'gemini-1.5-flash';
    this.mcpServerUrl = config.mcpServerUrl || Deno.env.get('MCP_SERVER_URL') || 'http://localhost:3002';
    this.customToolLister = customToolLister;
    this.customToolExecutor = customToolExecutor;
  }

  public async procesarMensaje(
    input: PeticionAsistenteInput,
  ): Promise<Result<RespuestaAsistenteOutput, DomainError>> {
    try {
      // 1. Obtener la lista de herramientas autorizadas para este usuario
      const tools = await this.obtenerToolsAutorizadas(input.tokenJwt);
      const toolsEjecutadas: string[] = [];

      // Si no hay API Key configurada (entorno de pruebas o setup inicial), responder con modo informativo
      if (!this.apiKey) {
        const nombresTools = tools.map((t) => t.name).join(', ');
        return Result.ok({
          respuesta:
            `Hola, soy el Asistente IA de Warengine. Tu sesión está activa y tienes acceso a las siguientes herramientas MCP: [${nombresTools}]. ` +
            `Para procesar consultas en lenguaje natural con el modelo Gemini, configure la variable de entorno GEMINI_API_KEY.`,
          toolsEjecutadas: [],
        });
      }

      // 2. Configurar cliente de Google Gemini con Function Calling
      const ai = new GoogleGenerativeAI(this.apiKey);

      // Mapear Tools de MCP a Function Declarations de Gemini
      // Nota: Gemini exige que los nombres sigan la convención ^[a-zA-Z_][a-zA-Z0-9_]*$ (sin guiones)
      const mapNombreToGemini = (name: string) => name.replace(/-/g, '_');
      const mapNombreToMcp = (name: string) => name.replace(/_/g, '-');

      const functionDeclarations = tools.map((t) => ({
        name: mapNombreToGemini(t.name),
        description: t.description,
        parameters: t.inputSchema ? this.sanitizarSchemaParaGemini(t.inputSchema) : undefined,
      }));

      const model = ai.getGenerativeModel({
        model: this.modelName,
        systemInstruction:
          'Eres el Asistente Inteligente de Warengine, un ERP para empresas de ferretería y comercio. ' +
          'Tienes acceso a herramientas MCP para consultar existencias de inventario, stock bajo, facturas, métricas y conciliación. ' +
          'Responde siempre de forma clara, educada, precisa y en español. ' +
          'Cuando el usuario pregunte por datos del negocio, utiliza las herramientas correspondientes antes de responder.',
        tools: functionDeclarations.length > 0 ? [{ functionDeclarations: functionDeclarations as any }] : undefined,
      });

      // 3. Formatear historial previo para el chat de Gemini
      const contentsHistory = (input.historial || []).map((h) => ({
        role: h.rol === 'model' || h.rol === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.texto }],
      }));

      const chat = model.startChat({
        history: contentsHistory,
      });

      // 4. Enviar mensaje del usuario al modelo
      let response = await chat.sendMessage(input.mensaje);
      let functionCalls = response.response.functionCalls();

      // 5. Bucle de ejecución de Function Calling (máximo 5 iteraciones de seguridad)
      let iteraciones = 0;
      while (functionCalls && functionCalls.length > 0 && iteraciones < 5) {
        iteraciones++;
        const partsParaGemini: any[] = [];

        for (const call of functionCalls) {
          const mcpToolName = mapNombreToMcp(call.name);
          toolsEjecutadas.push(mcpToolName);

          const toolArgs = (call.args as Record<string, unknown>) || {};
          let resultadoTexto: string;

          try {
            resultadoTexto = await this.ejecutarTool(mcpToolName, toolArgs, input.tokenJwt);
          } catch (err: any) {
            resultadoTexto = `Error al ejecutar la herramienta '${mcpToolName}': ${err.message || String(err)}`;
          }

          partsParaGemini.push({
            functionResponse: {
              name: call.name,
              response: { resultado: resultadoTexto },
            },
          });
        }

        // Devolver el resultado de la(s) herramienta(s) a Gemini para que elabore la respuesta final
        response = await chat.sendMessage(partsParaGemini);
        functionCalls = response.response.functionCalls();
      }

      const respuestaFinal = response.response.text();

      return Result.ok({
        respuesta: respuestaFinal,
        toolsEjecutadas,
      });
    } catch (error: any) {
      console.error('[GEMINI-ASISTENTE-ERROR] Fallo al procesar mensaje con Gemini:', error);
      return Result.fail(
        new ErrorComunicacionAsistenteError(
          error.message || 'Error inesperado durante la comunicación con el modelo Gemini.',
        ),
      );
    }
  }

  /**
   * Obtiene la lista de Tools disponibles llamando al endpoint /sse del MCP Server
   * o utilizando el listador personalizado provisto en el constructor.
   */
  private async obtenerToolsAutorizadas(tokenJwt: string): Promise<McpToolDeclaration[]> {
    if (this.customToolLister) {
      return await this.customToolLister(tokenJwt);
    }

    // Por defecto, se consulta al catálogo oficial del servidor MCP
    // Para entornos donde el servidor MCP corre en el mismo backend, importamos dinámicamente el catálogo
    try {
      const { obtenerCatalogoCompleto, inicializarCatalogoTools } = await import(
        '../../../apps/mcp-server/src/index.ts'
      );
      inicializarCatalogoTools();
      const catalogo = obtenerCatalogoCompleto();

      return catalogo.map((t: any) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.schema ? this.zodShapeToJsonSchema(t.shape) : undefined,
      }));
    } catch (_e) {
      return [];
    }
  }

  /**
   * Ejecuta una Tool específica enviando la petición al servidor MCP con el token del usuario.
   */
  private async ejecutarTool(
    toolName: string,
    args: Record<string, unknown>,
    tokenJwt: string,
  ): Promise<string> {
    if (this.customToolExecutor) {
      return await this.customToolExecutor(toolName, args, tokenJwt);
    }

    // Si hay un servidor MCP HTTP activo en mcpServerUrl, podemos enviar la petición
    // O procesar a través del gateway en memoria si estamos en el mismo entorno de ejecución
    try {
      const {
        McpAuthorizationGateway,
        obtenerCatalogoCompleto,
        validarSesionJwtMcp,
      } = await import('../../../apps/mcp-server/src/index.ts');
      const { createContainer } = await import('../../composition/src/container.ts');

      const container = createContainer();
      const mockReq = {
        headers: { authorization: `Bearer ${tokenJwt}` },
      } as any;

      const sesionResult = await validarSesionJwtMcp(mockReq, '', container);
      if (sesionResult.isFailure) {
        return `Acceso denegado: ${sesionResult.error.message}`;
      }

      const catalogo = obtenerCatalogoCompleto();
      const toolDef = catalogo.find((t: any) => t.name === toolName);

      if (!toolDef) {
        return `La herramienta '${toolName}' no existe o no está registrada en el servidor MCP.`;
      }

      const res = await McpAuthorizationGateway.procesarTool({
        toolName: toolDef.name,
        permisoRequerido: toolDef.permisoRequerido,
        schema: toolDef.schema,
        args,
        sessionContext: sesionResult.value,
        container,
        handler: (argsValidados: any, ctx: any) => toolDef.handler(argsValidados, container, ctx),
        formateador: toolDef.formateador,
      });

      return res.content.map((c: any) => c.text).join('\n');
    } catch (e: any) {
      return `Error al invocar la herramienta: ${e.message}`;
    }
  }

  /**
   * Convierte una forma de propiedades Zod básica a JSON Schema simple compatible con Gemini.
   */
  private zodShapeToJsonSchema(shape?: Record<string, any>): Record<string, unknown> {
    if (!shape) {
      return { type: 'object', properties: {} };
    }

    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const description = value.description || '';
      properties[key] = {
        type: 'string', // Gemini interpreta types string/number/boolean
        description,
      };
    }

    return {
      type: 'object',
      properties,
      ...(required.length > 0 ? { required } : {}),
    };
  }

  /**
   * Limpia elementos de esquema que Gemini no acepta (como $schema o keywords complejas).
   */
  private sanitizarSchemaParaGemini(schema: Record<string, unknown>): Record<string, unknown> {
    const copia = { ...schema };
    delete copia['$schema'];
    delete copia['additionalProperties'];
    return copia;
  }
}
