/**
 * container.ts — Composition Root de Warengine.
 *
 * createContainer(env) es la función que conecta todos los paquetes:
 *   1. Lee la configuración validada del entorno.
 *   2. Crea el cliente de base de datos.
 *   3. Instancia los repositorios (database) pasándoles el cliente.
 *   4. Instancia los servicios técnicos (platform): jwt, hashing, mailer…
 *   5. Instancia los casos de uso (core) pasándoles los repositorios y servicios.
 *   6. Devuelve un objeto con todos los casos de uso listos para usar.
 */

import { getDatabase } from '../../database/src/client.ts';
import { DrizzleUsuarioRepository } from '../../database/src/repositories/autenticacion/drizzle-usuario.repository.ts';
import { DrizzleRolRepository } from '../../database/src/repositories/autenticacion/drizzle-rol.repository.ts';
import { DrizzleRefreshTokenRepository } from '../../database/src/repositories/autenticacion/drizzle-refresh-token.repository.ts';

import { JwtTokenService } from '../../platform/src/jwt/jwt-token-service.ts';
import { Argon2PasswordHasher } from '../../platform/src/hashing/argon2-password-hasher.ts';

import { LoginUseCase } from '../../core/src/autenticacion/application/use-cases/LoginUseCase.ts';
import { ValidarPermisoUseCase } from '../../core/src/autenticacion/application/use-cases/ValidarPermisoUseCase.ts';
import { RenovarTokenUseCase } from '../../core/src/autenticacion/application/use-cases/RenovarTokenUseCase.ts';

export interface AppContainer {
  autenticacion: {
    login: LoginUseCase;
    validarPermiso: ValidarPermisoUseCase;
    renovarToken: RenovarTokenUseCase;
  };
}

export function createContainer(_env?: Record<string, string>): AppContainer {
  const db = getDatabase();

  // 1. Instanciar Repositorios
  const usuarioRepository = new DrizzleUsuarioRepository(db);
  const rolRepository = new DrizzleRolRepository(db);
  const refreshTokenRepository = new DrizzleRefreshTokenRepository(db);

  // 2. Instanciar Servicios Técnicos
  const tokenService = new JwtTokenService(refreshTokenRepository);
  const passwordHasher = new Argon2PasswordHasher();

  // 3. Instanciar Casos de Uso
  const loginUseCase = new LoginUseCase(usuarioRepository, passwordHasher, tokenService);
  const validarPermisoUseCase = new ValidarPermisoUseCase(tokenService, usuarioRepository, rolRepository);
  const renovarTokenUseCase = new RenovarTokenUseCase(tokenService, usuarioRepository);

  return {
    autenticacion: {
      login: loginUseCase,
      validarPermiso: validarPermisoUseCase,
      renovarToken: renovarTokenUseCase,
    },
  };
}
