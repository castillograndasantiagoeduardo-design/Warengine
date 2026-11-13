import { createHmac, createHash, randomInt, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Genera un código OTP de 4 dígitos criptográficamente seguro (0000-9999).
 */
export function generarCodigoOtp(): string {
  const num = randomInt(0, 10000);
  return num.toString().padStart(4, '0');
}

/**
 * Calcula el HMAC-SHA256 del código OTP concatenado con el email normalizado.
 * @param codigo Código de 4 dígitos
 * @param email Correo electrónico normalizado
 * @param secret Clave secreta (RESET_HMAC_SECRET)
 */
export function hashearCodigoOtp(codigo: string, email: string, secret: string): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(`${email.trim().toLowerCase()}:${codigo.trim()}`);
  return hmac.digest('hex');
}

/**
 * Compara en tiempo constante un código OTP contra su HMAC-SHA256 guardado.
 */
export function compararCodigoOtp(
  codigo: string,
  email: string,
  secret: string,
  hashGuardado: string,
): boolean {
  try {
    const hashCalculado = hashearCodigoOtp(codigo, email, secret);
    const bufA = Buffer.from(hashCalculado, 'hex');
    const bufB = Buffer.from(hashGuardado, 'hex');
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Genera un token aleatorio seguro de 64 caracteres hexadecimales (32 bytes).
 */
export function generarResetToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Calcula el SHA-256 de un resetToken.
 */
export function hashearResetToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Compara en tiempo constante un resetToken contra su hash SHA-256 guardado.
 */
export function compararResetToken(token: string, hashGuardado: string): boolean {
  try {
    const hashCalculado = hashearResetToken(token);
    const bufA = Buffer.from(hashCalculado, 'hex');
    const bufB = Buffer.from(hashGuardado, 'hex');
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
