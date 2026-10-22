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
    case 'SUCURSAL_FUERA_DE_ALCANCE':
      status = 403; // Forbidden
      break;
    case 'CATEGORIA_NO_ENCONTRADA':
    case 'PROVEEDOR_NO_ENCONTRADO':
    case 'SUCURSAL_NO_ENCONTRADA':
    case 'USUARIO_NO_ENCONTRADO':
      status = 404; // Not Found
      break;
    case 'SKU_DUPLICADO':
    case 'STOCK_INSUFICIENTE':
    case 'ENTRADA_YA_ANULADA':
    case 'FACTURA_YA_ANULADA':
    case 'CATEGORIA_CON_PRODUCTOS_ACTIVOS':
    case 'PROVEEDOR_CON_PRODUCTOS_ACTIVOS':
    case 'ACTIVO_NO_DISPONIBLE':
    case 'ACTIVO_DE_BAJA':
    case 'ACTIVO_NO_PUEDE_DARSE_DE_BAJA':
    case 'ACTIVO_NO_PERMITE_MANTENIMIENTO':
    case 'MANTENIMIENTO_YA_FINALIZADO':
    case 'CODIGO_ACTIVO_DUPLICADO':
    case 'CATEGORIA_ACTIVO_DUPLICADA':
      status = 409; // Conflict
      break;
    case 'REQUIERE_2FA':
      status = 428; // Precondition Required
      break;
    case 'CODIGO_TOTP_INVALIDO':
    case 'TOTP_NO_CONFIGURADO':
    case 'TOTP_YA_ACTIVADO':
    case 'TOKEN_RECUPERACION_INVALIDO':
    case 'PASSWORDS_NO_COINCIDEN':
      status = 400; // Bad Request
      break;
    case 'LOGIN_BLOQUEADO':
    case 'LIMITE_SOLICITUDES_EXCEDIDO':
      status = 429; // Too Many Requests
      break;
        case 'TURNO_YA_ABIERTO':
      status = 409; // Conflicto con el estado actual
      break;
    case 'OPERADOR_SIN_SUCURSAL':
    case 'CLIENTE_B2B_DATOS_INCOMPLETOS':
    case 'CATEGORIA_INACTIVA':
    case 'PROVEEDOR_INACTIVO':
    case 'PRODUCTO_INACTIVO':
    case 'REFERENCIA_INVALIDA':
    case 'SKU_MODIFICACION_NO_PERMITIDA':
    case 'PAGO_INVALIDO':
    case 'MOTIVO_ANULACION_FACTURA_REQUERIDO':
    case 'CLIENTE_REQUERIDO_B2B':
    case 'CREDITO_NO_HABILITADO':
    case 'RESPONSABLE_FUERA_DE_SUCURSAL':
    case 'CATEGORIA_ACTIVO_INACTIVA':
    case 'FECHA_FIN_ANTERIOR_A_INICIO':
    case 'RESPONSABLE_INACTIVO':
    case 'FECHA_DEVOLUCION_INVALIDA':
      status = 422; // Regla de negocio violada
      break;
    case 'FACTURACION_SIN_TURNO_ABIERTO':
      status = 400; // Bad request
      break;
    default:
      if (error.code.endsWith('_NO_ENCONTRADO') || error.code.endsWith('_NO_ENCONTRADA')) {
        status = 404;
      } else {
        status = 400;
      }
  }

  const responseBody: Record<string, unknown> = {
    error: error.code,
    message: error.message,
  };

  if ('tempToken' in error && (error as { tempToken?: unknown }).tempToken) {
    responseBody.tempToken = (error as { tempToken: unknown }).tempToken;
  }

  return c.json(responseBody, status);
}

