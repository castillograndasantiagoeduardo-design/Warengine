import { Context } from 'hono';
import { ContentfulStatusCode } from 'hono/utils/http-status';
import { Result, DomainError } from '@warengine/shared-kernel';

export function presentResult<T>(c: Context, result: Result<T, DomainError>, successStatus: ContentfulStatusCode = 200) {
  if (result.isSuccess) {
    const val = result.value;
    return c.json(val !== undefined ? val : { success: true }, successStatus);
  }

  const error = result.error;
  let status: ContentfulStatusCode = 400; // Bad request por defecto

  switch (error.code) {
    case 'CREDENCIALES_INVALIDAS':
    case 'USUARIO_INACTIVO':
    case 'TOKEN_INVALIDO':
      status = 401; // Unauthorized
      break;
    case 'PERMISO_DENEGADO':
      status = 403; // Forbidden
      break;
    case 'CATEGORIA_NO_ENCONTRADA':
    case 'PROVEEDOR_NO_ENCONTRADO':
    case 'SUCURSAL_NO_ENCONTRADA':
    case 'USUARIO_NO_ENCONTRADO':
      status = 404; // Not Found
      break;
    case 'REQUIERE_2FA':
      status = 428; // Precondition Required
      break;
        case 'TURNO_YA_ABIERTO':
      status = 409; // Conflicto con el estado actual
      break;
    case 'OPERADOR_SIN_SUCURSAL':
      status = 422;
      break;
    case 'CLIENTE_B2B_DATOS_INCOMPLETOS':
      status = 422; // Regla de negocio violada
      break;
    default:
      if (error.code.endsWith('_NO_ENCONTRADO') || error.code.endsWith('_NO_ENCONTRADA')) {
        status = 404;
      } else {
        status = 400;
      }
  }

  return c.json({ error: error.code, message: error.message }, status);
}
