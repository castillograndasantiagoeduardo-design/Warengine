/**
 * Valida y obtiene el secreto JWT a partir de variables de entorno o parámetro provisto.
 * Si JWT_SECRET no existe o tiene menos de 32 caracteres, lanza un error impidiendo el arranque (RF-SA-D1).
 */
export function validarYObtenerJwtSecret(secreto?: string): Uint8Array {
  const secret = secreto ?? Deno.env.get('JWT_SECRET');

  if (!secret) {
    throw new Error('Configuración inválida: la variable de entorno JWT_SECRET es obligatoria.');
  }

  if (secret.length < 32) {
    throw new Error(
      `Configuración inválida: JWT_SECRET debe tener al menos 32 caracteres (longitud actual: ${secret.length}).`,
    );
  }

  return new TextEncoder().encode(secret);
}
