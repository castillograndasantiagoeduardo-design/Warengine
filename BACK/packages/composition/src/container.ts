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
import { DrizzleSucursalRepository } from '../../database/src/repositories/administracion/drizzle-sucursal.repository.ts';
import { DrizzleGestionUsuarioRepository } from '../../database/src/repositories/administracion/drizzle-gestion-usuario.repository.ts';

import { JwtTokenService } from '../../platform/src/jwt/jwt-token-service.ts';
import { Argon2PasswordHasher } from '../../platform/src/hashing/argon2-password-hasher.ts';

import {
  LoginUseCase,
  ValidarPermisoUseCase,
  RenovarTokenUseCase,
  ListarSucursalesUseCase,
  CrearSucursalUseCase,
  EditarSucursalUseCase,
  ListarUsuariosUseCase,
  CrearUsuarioUseCase,
  CambiarRolUsuarioUseCase,
  CambiarEstadoUsuarioUseCase,
} from '@warengine/core';

export interface AppContainer {
  autenticacion: {
    login: LoginUseCase;
    validarPermiso: ValidarPermisoUseCase;
    renovarToken: RenovarTokenUseCase;
  };
  administracion: {
    listarSucursales: ListarSucursalesUseCase;
    crearSucursal: CrearSucursalUseCase;
    editarSucursal: EditarSucursalUseCase;
    listarUsuarios: ListarUsuariosUseCase;
    crearUsuario: CrearUsuarioUseCase;
    cambiarRolUsuario: CambiarRolUsuarioUseCase;
    cambiarEstadoUsuario: CambiarEstadoUsuarioUseCase;
  };
}

export function createContainer(_env?: Record<string, string>): AppContainer {
  const db = getDatabase();

  // 1. Instanciar Repositorios
  const usuarioRepository = new DrizzleUsuarioRepository(db);
  const rolRepository = new DrizzleRolRepository(db);
  const refreshTokenRepository = new DrizzleRefreshTokenRepository(db);
  const sucursalRepository = new DrizzleSucursalRepository(db);
  const gestionUsuarioRepository = new DrizzleGestionUsuarioRepository(db);

  // 2. Instanciar Servicios Técnicos
  const tokenService = new JwtTokenService(refreshTokenRepository);
  const passwordHasher = new Argon2PasswordHasher();

  // 3. Instanciar Casos de Uso
  const loginUseCase = new LoginUseCase(usuarioRepository, passwordHasher, tokenService);
  const validarPermisoUseCase = new ValidarPermisoUseCase(tokenService, usuarioRepository, rolRepository);
  const renovarTokenUseCase = new RenovarTokenUseCase(tokenService, usuarioRepository);

  const listarSucursalesUseCase = new ListarSucursalesUseCase(sucursalRepository);
  const crearSucursalUseCase = new CrearSucursalUseCase(sucursalRepository);
  const editarSucursalUseCase = new EditarSucursalUseCase(sucursalRepository);

  const listarUsuariosUseCase = new ListarUsuariosUseCase(gestionUsuarioRepository);
  const crearUsuarioUseCase = new CrearUsuarioUseCase(
    gestionUsuarioRepository,
    sucursalRepository,
    passwordHasher,
  );
  const cambiarRolUsuarioUseCase = new CambiarRolUsuarioUseCase(gestionUsuarioRepository);
  const cambiarEstadoUsuarioUseCase = new CambiarEstadoUsuarioUseCase(gestionUsuarioRepository);

  return {
    autenticacion: {
      login: loginUseCase,
      validarPermiso: validarPermisoUseCase,
      renovarToken: renovarTokenUseCase,
    },
    administracion: {
      listarSucursales: listarSucursalesUseCase,
      crearSucursal: crearSucursalUseCase,
      editarSucursal: editarSucursalUseCase,
      listarUsuarios: listarUsuariosUseCase,
      crearUsuario: crearUsuarioUseCase,
      cambiarRolUsuario: cambiarRolUsuarioUseCase,
      cambiarEstadoUsuario: cambiarEstadoUsuarioUseCase,
    },
  };
}
