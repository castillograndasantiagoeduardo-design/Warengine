import {
  GoogleGenerativeAI,
  type FunctionDeclaration,
  type FunctionDeclarationSchema,
  type Part,
  type Tool,
} from '@google/generative-ai';
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
    this.apiKey = config.apiKey ?? Deno.env.get('GEMINI_API_KEY');
    this.modelName = config.modelName ?? Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite';
    this.mcpServerUrl = config.mcpServerUrl ?? Deno.env.get('MCP_SERVER_URL') ?? 'http://localhost:3002';
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

      const functionDeclarations: FunctionDeclaration[] = tools.map((t) => ({
        name: mapNombreToGemini(t.name),
        description: t.description,
        parameters: t.inputSchema
          ? (this.sanitizarSchemaParaGemini(t.inputSchema) as unknown as FunctionDeclarationSchema)
          : undefined,
      }));

      const modelTools: Tool[] | undefined = functionDeclarations.length > 0
        ? [{ functionDeclarations }]
        : undefined;

      const model = ai.getGenerativeModel({
        model: this.modelName,
        systemInstruction:
          'Eres el Asistente Inteligente de Warengine, un ERP para empresas de ferretería y comercio. ' +
          'Tienes acceso a herramientas MCP para consultar existencias de inventario, stock bajo, facturas, métricas, y crear o ajustar productos. ' +
          'Responde siempre de forma clara, educada, precisa y en español.\n\n' +
          'DIRECTRICES DE INVENTARIO Y HERRAMIENTAS:\n' +
          '1. Para consultar existencias de productos o inventario, usa la herramienta "consulta_stock". ' +
          'Si el usuario pregunta por una categoría completa (ej: "computadores", "laptops", "herramientas"), envía el término en el parámetro "categoria". ' +
          'Si el usuario es administrador de sucursal, no le exijas especificar el ID de sucursal ni el SKU; el sistema consultará automáticamente su sede asignada. ' +
          'Si el usuario es SuperAdmin, puede solicitar el inventario de cualquier sucursal específica (indicando sucursalId) o de forma global.\n' +
          '2. Si el usuario pide buscar un producto específico por nombre o código, usa "nombre" o "sku".\n' +
          '3. Si el usuario solicita agregar o descontar unidades de stock, utiliza la herramienta "ajustar_stock".\n' +
          '4. REGLA CRÍTICA: Refleja con fidelidad estricta el resultado devuelto por las herramientas. ' +
          'Si la herramienta devuelve un error o no encuentra datos, informa con precisión qué sucedió, NUNCA inventes resultados.',
        tools: modelTools,
      });

      // 3. Formatear historial previo y mensaje actual del usuario
      const contents: Array<{
        role: string;
        parts: Array<Record<string, unknown>>;
      }> = [
        ...(input.historial || []).map((h) => ({
          role: h.rol === 'model' || h.rol === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.texto }],
        })),
        {
          role: 'user',
          parts: [{ text: input.mensaje }],
        },
      ];

      // 4. Enviar conversación al modelo
      let result = await model.generateContent({
        contents: contents as unknown as Array<{ role: string; parts: Part[] }>,
      });
      let candidate = result.response.candidates?.[0];
      let functionCalls = result.response.functionCalls();

      // 5. Bucle de ejecución de Function Calling (máximo 5 iteraciones de seguridad)
      let iteraciones = 0;
      while (functionCalls && functionCalls.length > 0 && iteraciones < 5) {
        iteraciones++;

        // Guardar el turno del modelo con sus functionCalls y firmas de razonamiento en la conversación
        if (candidate?.content) {
          contents.push(
            candidate.content as unknown as { role: string; parts: Array<Record<string, unknown>> },
          );
        }

        const functionResponseParts: Array<Record<string, unknown>> = [];

        for (const call of functionCalls) {
          const mcpToolName = mapNombreToMcp(call.name);
          toolsEjecutadas.push(mcpToolName);

          const toolArgs = (call.args as Record<string, unknown>) || {};
          let resultadoTexto: string;

          try {
            resultadoTexto = await this.ejecutarTool(mcpToolName, toolArgs, input.tokenJwt);
          } catch (err: unknown) {
            const errMensaje = err instanceof Error ? err.message : String(err);
            resultadoTexto = `Error al ejecutar la herramienta '${mcpToolName}': ${errMensaje}`;
          }

          functionResponseParts.push({
            functionResponse: {
              name: call.name,
              response: { resultado: resultadoTexto },
            },
          });
        }

        // Agregar la respuesta de las funciones como rol 'user' (estándar requerido por Gemini v1beta)
        contents.push({
          role: 'user',
          parts: functionResponseParts,
        });

        // Solicitar a Gemini la siguiente respuesta con el resultado de las herramientas incorporado
        result = await model.generateContent({
          contents: contents as unknown as Array<{ role: string; parts: Part[] }>,
        });
        candidate = result.response.candidates?.[0];
        functionCalls = result.response.functionCalls();
      }

      const respuestaFinal = result.response.text();

      return Result.ok({
        respuesta: respuestaFinal,
        toolsEjecutadas,
      });
    } catch (error: unknown) {
      console.error('[GEMINI-ASISTENTE-ERROR] Fallo al procesar mensaje con Gemini:', error);
      const errorMsg = error instanceof Error
        ? error.message
        : 'Error inesperado durante la comunicación con el modelo Gemini.';
      return Result.fail(new ErrorComunicacionAsistenteError(errorMsg));
    }
  }

  /**
   * Obtiene la lista de Tools disponibles delegando al listador personalizado
   * o consultando la URL HTTP del servidor MCP configurado.
   */
  private async obtenerToolsAutorizadas(tokenJwt: string): Promise<McpToolDeclaration[]> {
    if (this.customToolLister) {
      return await this.customToolLister(tokenJwt);
    }

    try {
      const response = await fetch(`${this.mcpServerUrl}/tools`, {
        headers: { authorization: `Bearer ${tokenJwt}` },
      });
      if (!response.ok) {
        return [];
      }
      const data = (await response.json()) as { tools?: McpToolDeclaration[] };
      return data.tools || [];
    } catch (_e: unknown) {
      return [];
    }
  }

  /**
   * Ejecuta una Tool específica enviando la petición al ejecutor personalizado
   * o al servidor MCP por HTTP con el token del usuario.
   */
  private async ejecutarTool(
    toolName: string,
    args: Record<string, unknown>,
    tokenJwt: string,
  ): Promise<string> {
    if (this.customToolExecutor) {
      return await this.customToolExecutor(toolName, args, tokenJwt);
    }

    try {
      const response = await fetch(`${this.mcpServerUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${tokenJwt}`,
        },
        body: JSON.stringify({ tool: toolName, arguments: args }),
      });

      if (!response.ok) {
        return `Error del servidor MCP (${response.status}): ${await response.text()}`;
      }

      const res = (await response.json()) as { content?: Array<{ text: string }> };
      return (res.content || []).map((c) => c.text).join('\n');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return `Error al invocar la herramienta: ${msg}`;
    }
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
