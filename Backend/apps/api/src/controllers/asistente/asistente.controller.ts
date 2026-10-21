import { chatMensajeSchema, type ChatRespuestaDTO } from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { safeHandler, leerJson } from '../../utils/handler.ts';
import { obtenerIdentidad } from '../../utils/identidad.ts';
import { getTokensFromCookies } from '../../utils/cookie.ts';

/**
 * Controlador HTTP para interactuar con el Asistente IA de Warengine (RF-SA-i1 / RF-SA-i2).
 */
export function conversarConAsistenteController(container: AppContainer) {
  return safeHandler(async (c) => {
    // 1. Validar cuerpo de la petición con esquema Zod
    const body = await leerJson(c);
    const parsed = chatMensajeSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Parámetros inválidos para la consulta al asistente.',
          issues: parsed.error.errors,
        },
        400,
      );
    }

    // 2. Extraer token de autorización e identidad activa
    let token = getTokensFromCookies(c).accessToken;
    if (!token) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return c.json({ error: 'TOKEN_REQUERIDO', message: 'Token de autorización requerido.' }, 401);
    }

    const identidad = obtenerIdentidad(c);

    // 3. Ejecutar caso de uso que orquesta Gemini y el servidor MCP
    const resultado = await container.asistente.conversar.execute({
      mensaje: parsed.data.mensaje,
      tokenJwt: token,
      usuarioId: identidad.usuarioId,
      historial: parsed.data.historial,
    });

    if (resultado.isFailure) {
      return c.json(
        {
          error: resultado.error.code,
          message: resultado.error.message,
        },
        500,
      );
    }

    const data: ChatRespuestaDTO = {
      respuesta: resultado.value.respuesta,
      toolsEjecutadas: resultado.value.toolsEjecutadas,
      fecha: new Date().toISOString(),
    };

    return c.json(data, 200);
  });
}
