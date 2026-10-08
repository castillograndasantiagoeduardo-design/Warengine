/**
 * jwt.config.ts — Validación de configuración para JWT en platform.
 *
 * La lectura y validación se realiza de forma explícita al arrancar la aplicación
 * desde el contenedor de composición, no en el momento de importar este módulo.
 */
export function obtenerJwtSecret(env?: Record<string, string>): string {
  const secret = env?.['JWT_SECRET'] ?? Deno.env.get('JWT_SECRET');

  if (!secret) {
    throw new Error(
      'La variable de entorno JWT_SECRET es requerida pero no está definida. ' +
        'Debe contener una clave segura de al menos 32 caracteres para firmar los tokens JWT.',
    );
  }

  if (secret.length < 32) {
    throw new Error(
      `La variable de entorno JWT_SECRET debe tener al menos 32 caracteres (longitud actual: ${secret.length}). ` +
        'Genera un secreto seguro, por ejemplo con: openssl rand -base64 32',
    );
  }

  return secret;
}
