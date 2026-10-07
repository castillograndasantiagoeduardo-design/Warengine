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
import { DrizzleIntentoLoginRepository } from '../../database/src/repositories/autenticacion/drizzle-intento-login.repository.ts';
import { DrizzleSucursalRepository } from '../../database/src/repositories/administracion/drizzle-sucursal.repository.ts';
import { DrizzleAuditoriaRepository } from '../../database/src/repositories/administracion/drizzle-auditoria.repository.ts';
import { DrizzleGestionUsuarioRepository } from '../../database/src/repositories/administracion/drizzle-gestion-usuario.repository.ts';
import { DrizzleClienteRepository } from '../../database/src/repositories/facturacion/drizzle-cliente.repository.ts';
import { DrizzleCategoriaRepository } from '../../database/src/repositories/inventario/drizzle-categoria.repository.ts';
import { DrizzleProveedorRepository } from '../../database/src/repositories/inventario/drizzle-proveedor.repository.ts';

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
  RegistrarClienteUseCase,
  BuscarClientesUseCase,
  ListarCategoriasUseCase,
  ObtenerCategoriaPorIdUseCase,
  CrearCategoriaUseCase,
  EditarCategoriaUseCase,
  InactivarCategoriaUseCase,
  ReactivarCategoriaUseCase,
  CambiarEstadoCategoriaUseCase,
  ListarProveedoresUseCase,
  ObtenerProveedorPorIdUseCase,
  CrearProveedorUseCase,
  EditarProveedorUseCase,
  InactivarProveedorUseCase,
  ReactivarProveedorUseCase,
  CambiarEstadoProveedorUseCase,
  ConsultarAuditoriaUseCase,
  RestablecerPasswordUsuarioUseCase
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
    consultarAuditoria: ConsultarAuditoriaUseCase;
    restablecerPasswordUsuario: RestablecerPasswordUsuarioUseCase;
  };
  inventario: {
    listarCategorias: ListarCategoriasUseCase;
    obtenerCategoriaPorId: ObtenerCategoriaPorIdUseCase;
    crearCategoria: CrearCategoriaUseCase;
    editarCategoria: EditarCategoriaUseCase;
    inactivarCategoria: InactivarCategoriaUseCase;
    reactivarCategoria: ReactivarCategoriaUseCase;
    cambiarEstadoCategoria: CambiarEstadoCategoriaUseCase;
    listarProveedores: ListarProveedoresUseCase;
    obtenerProveedorPorId: ObtenerProveedorPorIdUseCase;
    crearProveedor: CrearProveedorUseCase;
    editarProveedor: EditarProveedorUseCase;
    inactivarProveedor: InactivarProveedorUseCase;
    reactivarProveedor: ReactivarProveedorUseCase;
    cambiarEstadoProveedor: CambiarEstadoProveedorUseCase;
  };
  facturacion: {
    registrarCliente: RegistrarClienteUseCase;
    buscarClientes: BuscarClientesUseCase;
  };
}

export function createContainer(_env?: Record<string, string>): AppContainer {
  const db = getDatabase();

  // 1. Instanciar Repositorios
  const usuarioRepository = new DrizzleUsuarioRepository(db);
  const rolRepository = new DrizzleRolRepository(db);
  const refreshTokenRepository = new DrizzleRefreshTokenRepository(db);
  const intentoLoginRepository = new DrizzleIntentoLoginRepository(db);
  const sucursalRepository = new DrizzleSucursalRepository(db);
  const gestionUsuarioRepository = new DrizzleGestionUsuarioRepository(db);
  const clienteRepository = new DrizzleClienteRepository(db);
  const categoriaRepository = new DrizzleCategoriaRepository(db);
  const proveedorRepository = new DrizzleProveedorRepository(db);

  const auditoriaRepository = new DrizzleAuditoriaRepository(db);

  // 2. Instanciar Servicios Técnicos
  const tokenService = new JwtTokenService(refreshTokenRepository);
  const passwordHasher = new Argon2PasswordHasher();

  // 3. Instanciar Casos de Uso
  const loginUseCase = new LoginUseCase(
    usuarioRepository,
    passwordHasher,
    tokenService,
    intentoLoginRepository,
  );
  const validarPermisoUseCase = new ValidarPermisoUseCase(
    tokenService,
    usuarioRepository,
    rolRepository,
    auditoriaRepository,
  );
  const renovarTokenUseCase = new RenovarTokenUseCase(tokenService, usuarioRepository);

  const listarSucursalesUseCase = new ListarSucursalesUseCase(sucursalRepository);
  const crearSucursalUseCase = new CrearSucursalUseCase(sucursalRepository, auditoriaRepository);
  const editarSucursalUseCase = new EditarSucursalUseCase(sucursalRepository, auditoriaRepository);

  const listarUsuariosUseCase = new ListarUsuariosUseCase(gestionUsuarioRepository);
  const crearUsuarioUseCase = new CrearUsuarioUseCase(
    gestionUsuarioRepository,
    sucursalRepository,
    passwordHasher,
    auditoriaRepository,
  );
  const cambiarRolUsuarioUseCase = new CambiarRolUsuarioUseCase(
    gestionUsuarioRepository,
    auditoriaRepository,
  );
  const cambiarEstadoUsuarioUseCase = new CambiarEstadoUsuarioUseCase(
    gestionUsuarioRepository,
    auditoriaRepository,
  );
  const restablecerPasswordUsuarioUseCase = new RestablecerPasswordUsuarioUseCase(
    gestionUsuarioRepository,
    passwordHasher,
    auditoriaRepository,
  );
  const consultarAuditoriaUseCase = new ConsultarAuditoriaUseCase(auditoriaRepository);

  // Casos de uso de Categorías
  const listarCategoriasUseCase = new ListarCategoriasUseCase(categoriaRepository);
  const obtenerCategoriaPorIdUseCase = new ObtenerCategoriaPorIdUseCase(categoriaRepository);
  const crearCategoriaUseCase = new CrearCategoriaUseCase(categoriaRepository, auditoriaRepository);
  const editarCategoriaUseCase = new EditarCategoriaUseCase(categoriaRepository, auditoriaRepository);
  const inactivarCategoriaUseCase = new InactivarCategoriaUseCase(categoriaRepository, auditoriaRepository);
  const reactivarCategoriaUseCase = new ReactivarCategoriaUseCase(categoriaRepository, auditoriaRepository);
  const cambiarEstadoCategoriaUseCase = new CambiarEstadoCategoriaUseCase(
    inactivarCategoriaUseCase,
    reactivarCategoriaUseCase,
  );

  // Casos de uso de Proveedores
  const listarProveedoresUseCase = new ListarProveedoresUseCase(proveedorRepository);
  const obtenerProveedorPorIdUseCase = new ObtenerProveedorPorIdUseCase(proveedorRepository);
  const crearProveedorUseCase = new CrearProveedorUseCase(proveedorRepository, auditoriaRepository);
  const editarProveedorUseCase = new EditarProveedorUseCase(proveedorRepository, auditoriaRepository);
  const inactivarProveedorUseCase = new InactivarProveedorUseCase(proveedorRepository, auditoriaRepository);
  const reactivarProveedorUseCase = new ReactivarProveedorUseCase(proveedorRepository, auditoriaRepository);
  const cambiarEstadoProveedorUseCase = new CambiarEstadoProveedorUseCase(
    inactivarProveedorUseCase,
    reactivarProveedorUseCase,
  );

  const registrarClienteUseCase = new RegistrarClienteUseCase(clienteRepository, auditoriaRepository);
  const buscarClientesUseCase = new BuscarClientesUseCase(clienteRepository);

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
      consultarAuditoria: consultarAuditoriaUseCase,
      restablecerPasswordUsuario: restablecerPasswordUsuarioUseCase,
    },
    inventario: {
      listarCategorias: listarCategoriasUseCase,
      obtenerCategoriaPorId: obtenerCategoriaPorIdUseCase,
      crearCategoria: crearCategoriaUseCase,
      editarCategoria: editarCategoriaUseCase,
      inactivarCategoria: inactivarCategoriaUseCase,
      reactivarCategoria: reactivarCategoriaUseCase,
      cambiarEstadoCategoria: cambiarEstadoCategoriaUseCase,
      listarProveedores: listarProveedoresUseCase,
      obtenerProveedorPorId: obtenerProveedorPorIdUseCase,
      crearProveedor: crearProveedorUseCase,
      editarProveedor: editarProveedorUseCase,
      inactivarProveedor: inactivarProveedorUseCase,
      reactivarProveedor: reactivarProveedorUseCase,
      cambiarEstadoProveedor: cambiarEstadoProveedorUseCase,
    },
    facturacion: {
      registrarCliente: registrarClienteUseCase,
      buscarClientes: buscarClientesUseCase,
    },
  };
}
