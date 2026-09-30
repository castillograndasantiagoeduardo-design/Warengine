import { Context } from 'hono';
import { Result, DomainError } from '@warengine/shared-kernel';

export function presentResult<T>(c: Context, result: Result<T, DomainError>, successStatus = 200) {
  if (result.isSuccess) {
    const val = result.value;
    return c.json(val !== undefined ? val : { success: true }, successStatus as any);
  }

  const error = result.error;
  let status = 400; // Bad request por defecto

  switch (error.code) {
    case 'CREDENCIALES_INVALIDAS':
    case 'USUARIO_INACTIVO':
    case 'TOKEN_INVALIDO':
      status = 401; // Unauthorized
      break;
    case 'PERMISO_DENEGADO':
      status = 403; // Forbidden
      break;
    case 'REQUIERE_2FA':
      status = 428; // Precondition Required
      break;
    default:
      status = 400; 
  }

  return c.json({ error: error.code, message: error.message }, status as any);
}
