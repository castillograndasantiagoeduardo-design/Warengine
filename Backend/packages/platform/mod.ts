/**
 * mod.ts — Punto de entrada de @warengine/platform.
 *
 * Exportará los adaptadores técnicos sin lógica de negocio:
 *   - jwt/       → implementa el port TokenService (firma/verifica JWT)
 *   - hashing/   → implementa el port PasswordHasher (Argon2 o bcrypt)
 *   - totp/      → implementa el port TotpService (autenticación de dos factores)
 *   - mailer/    → implementa el port Mailer (recuperación de contraseña)
 *   - logger/    → logger estructurado (no usa console.log en producción)
 *   - rate-limit/ → implementa conteo de intentos por IP/email
 *   - config/    → variables de entorno validadas con Zod al arrancar
 *
 * REGLA: este paquete no contiene reglas de negocio. Solo "fontanería"
 * técnica. Si aquí aparece una regla de Warengine, está en el lugar equivocado.
 */

