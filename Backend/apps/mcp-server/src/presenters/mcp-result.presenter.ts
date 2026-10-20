import { DomainError, Result } from '@warengine/shared-kernel';

export interface McpPresenterResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Serializa de forma segura el resultado de un Caso de Uso (Result<T, DomainError>)
 * en un bloque de respuesta compatible con el estándar MCP (RF-SA-I8 / RF-SA-I12).
 */
export function presentMcpResult<T>(
  result: Result<T, DomainError>,
  formateadorPersonalizado?: (valor: T) => string,
): McpPresenterResponse {
  if (result.isSuccess) {
    const val = result.value;

    if (val === undefined || val === null) {
      return {
        content: [{ type: 'text', text: 'Operación completada exitosamente.' }],
      };
    }

    if (formateadorPersonalizado) {
      return {
        content: [{ type: 'text', text: formateadorPersonalizado(val) }],
      };
    }

    if (typeof val === 'string') {
      return {
        content: [{ type: 'text', text: val }],
      };
    }

    // Serializa estructuras u objetos en JSON legible para el modelo de lenguaje
    return {
      content: [{ type: 'text', text: JSON.stringify(val, null, 2) }],
    };
  }

  // Manejo de Fallos (isFailure): Respuestas limpias y seguras (RF-SA-I12)
  const error = result.error;
  let mensajeSeguro = error.message;

  switch (error.code) {
    case 'PERMISO_DENEGADO':
    case 'SUCURSAL_FUERA_DE_ALCANCE':
      mensajeSeguro = 'No cuentas con los permisos necesarios para consultar u operar sobre esta información.';
      break;
    case 'TOKEN_INVALIDO':
    case 'USUARIO_INACTIVO':
      mensajeSeguro = 'Tu sesión conversacional no es válida o ha expirado. Por favor, inicia sesión de nuevo.';
      break;
    case 'PRODUCTO_NO_ENCONTRADO':
      mensajeSeguro = 'No se encontró ningún producto con los criterios especificados.';
      break;
    case 'SUCURSAL_NO_ENCONTRADA':
      mensajeSeguro = 'La sucursal especificada no existe en el sistema.';
      break;
    case 'STOCK_INSUFICIENTE':
      mensajeSeguro = 'El inventario disponible es insuficiente para cubrir la cantidad solicitada.';
      break;
    default:
      // Conserva el mensaje de dominio sin exponer datos técnicos de infraestructura
      mensajeSeguro = error.message || 'Ocurrió un error al procesar la solicitud en el servidor.';
      break;
  }

  return {
    isError: true,
    content: [{ type: 'text', text: mensajeSeguro }],
  };
}
