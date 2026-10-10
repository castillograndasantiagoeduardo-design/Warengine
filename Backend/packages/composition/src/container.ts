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
import { DrizzleProductoRepository } from '../../database/src/repositories/inventario/drizzle-producto.repository.ts';
import { DrizzleTurnoCajaRepository } from '../../database/src/repositories/facturacion/drizzle-turno-caja.repository.ts';
import { DrizzleUsuarioSucursalRepository } from '../../database/src/repositories/administracion/drizzle-usuario-sucursal.repository.ts';

import { DrizzleSucursalOperadorRepository } from '../../database/src/repositories/facturacion/drizzle-sucursal-operador.repository.ts';

import { JwtTokenService } from '../../platform/src/jwt/jwt-token-service.ts';
import { Argon2PasswordHasher } from '../../platform/src/hashing/argon2-password-hasher.ts';
import { validarYObtenerJwtSecret } from '../../platform/src/config/jwt.config.ts';

import {
  LoginUseCase,
  LogoutUseCase,
  PoliticaBloqueoLogin,
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
  ListarProductosUseCase,
  ObtenerProductoPorIdUseCase,
  CrearProductoUseCase,
  EditarProductoUseCase,
  InactivarProductoUseCase,
  ReactivarProductoUseCase,
  CambiarEstadoProductoUseCase,
  RestablecerPasswordUsuarioUseCase,
  AbrirTurnoCajaUseCase,
  ObtenerTurnoActualUseCase,
  AsignarSucursalesUsuarioUseCase,
  ObtenerSucursalesUsuarioUseCase,
} from '@warengine/core';

export interface AppContainer {
  autenticacion: {
    login: LoginUseCase;
    logout: LogoutUseCase;
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
    asignarSucursalesUsuario: AsignarSucursalesUsuarioUseCase;
    obtenerSucursalesUsuario: ObtenerSucursalesUsuarioUseCase;

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
    listarProductos: ListarProductosUseCase;
    obtenerProductoPorId: ObtenerProductoPorIdUseCase;
    crearProducto: CrearProductoUseCase;
    editarProducto: EditarProductoUseCase;
    inactivarProducto: InactivarProductoUseCase;
    reactivarProducto: ReactivarProductoUseCase;
    cambiarEstadoProducto: CambiarEstadoProductoUseCase;
  };
  facturacion: {
    registrarCliente: RegistrarClienteUseCase;
    buscarClientes: BuscarClientesUseCase;
    abrirTurnoCaja: AbrirTurnoCajaUseCase;
    obtenerTurnoActual: ObtenerTurnoActualUseCase;
  };
}

function leerEnteroPositivo(
  valor: string | undefined,
  porDefecto: number,
  nombreVariable: string,
): number {
  if (valor === undefined || valor.trim() === '') {
    return porDefecto;
  }
  const parsed = Number(valor);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `Configuración inválida: la variable de entorno ${nombreVariable} debe ser un entero positivo mayor a 0 (recibido: "${valor}").`,
    );
  }
  return parsed;
}

export function createContainer(_env?: Record<string, string>): AppContainer {
  const getEnv = (key: string): string | undefined => _env?.[key] ?? Deno.env.get(key);

  const politicaBloqueo: PoliticaBloqueoLogin = {
    maxIntentosCuenta: leerEnteroPositivo(getEnv('LOGIN_MAX_INTENTOS_CUENTA'), 5, 'LOGIN_MAX_INTENTOS_CUENTA'),
    ventanaCuentaMinutos: leerEnteroPositivo(getEnv('LOGIN_VENTANA_CUENTA_MIN'), 5, 'LOGIN_VENTANA_CUENTA_MIN'),
    maxIntentosIp: leerEnteroPositivo(getEnv('LOGIN_MAX_INTENTOS_IP'), 20, 'LOGIN_MAX_INTENTOS_IP'),
    ventanaIpMinutos: leerEnteroPositivo(getEnv('LOGIN_VENTANA_IP_MIN'), 15, 'LOGIN_VENTANA_IP_MIN'),
  };

  const jwtSecret = validarYObtenerJwtSecret(getEnv('JWT_SECRET'));

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
  const productoRepository = new DrizzleProductoRepository(db);
  const usuarioSucursalRepository = new DrizzleUsuarioSucursalRepository(db);
  const auditoriaRepository = new DrizzleAuditoriaRepository(db);
  const turnoCajaRepository = new DrizzleTurnoCajaRepository(db);
  const sucursalOperadorRepository = new DrizzleSucursalOperadorRepository(db);
  // 2. Instanciar Servicios Técnicos
  const tokenService = new JwtTokenService(refreshTokenRepository, jwtSecret);
  const passwordHasher = new Argon2PasswordHasher();

  // 3. Instanciar Casos de Uso
  const loginUseCase = new LoginUseCase(
    usuarioRepository,
    passwordHasher,
    tokenService,
    intentoLoginRepository,
    intentoLoginRepository,
    politicaBloqueo,
  );
  const logoutUseCase = new LogoutUseCase(tokenService);
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
  const abrirTurnoCajaUseCase = new AbrirTurnoCajaUseCase(
    turnoCajaRepository,
    sucursalOperadorRepository,
    auditoriaRepository,
  );
  const asignarSucursalesUsuarioUseCase = new AsignarSucursalesUsuarioUseCase(
    gestionUsuarioRepository,
    sucursalRepository,
    usuarioSucursalRepository,
    auditoriaRepository,
  );
  const obtenerSucursalesUsuarioUseCase = new ObtenerSucursalesUsuarioUseCase(
    gestionUsuarioRepository,
    sucursalRepository,
    usuarioSucursalRepository,  
  );
  const obtenerTurnoActualUseCase = new ObtenerTurnoActualUseCase(turnoCajaRepository);
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

  // Casos de uso de Productos
  const listarProductosUseCase = new ListarProductosUseCase(productoRepository);
  const obtenerProductoPorIdUseCase = new ObtenerProductoPorIdUseCase(productoRepository);
  const crearProductoUseCase = new CrearProductoUseCase(
    productoRepository,
    categoriaRepository,
    proveedorRepository,
    auditoriaRepository,
  );
  const editarProductoUseCase = new EditarProductoUseCase(
    productoRepository,
    categoriaRepository,
    proveedorRepository,
    auditoriaRepository,
  );
  const inactivarProductoUseCase = new InactivarProductoUseCase(productoRepository, auditoriaRepository);
  const reactivarProductoUseCase = new ReactivarProductoUseCase(productoRepository, auditoriaRepository);
  const cambiarEstadoProductoUseCase = new CambiarEstadoProductoUseCase(
    inactivarProductoUseCase,
    reactivarProductoUseCase,
  );

  const registrarClienteUseCase = new RegistrarClienteUseCase(clienteRepository, auditoriaRepository);
  const buscarClientesUseCase = new BuscarClientesUseCase(clienteRepository);

  return {
    autenticacion: {
      login: loginUseCase,
      logout: logoutUseCase,
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
      asignarSucursalesUsuario: asignarSucursalesUsuarioUseCase,
      obtenerSucursalesUsuario: obtenerSucursalesUsuarioUseCase,
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
      listarProductos: listarProductosUseCase,
      obtenerProductoPorId: obtenerProductoPorIdUseCase,
      crearProducto: crearProductoUseCase,
      editarProducto: editarProductoUseCase,
      inactivarProducto: inactivarProductoUseCase,
      reactivarProducto: reactivarProductoUseCase,
      cambiarEstadoProducto: cambiarEstadoProductoUseCase,
    },
    facturacion: {
      registrarCliente: registrarClienteUseCase,
      buscarClientes: buscarClientesUseCase,
      abrirTurnoCaja: abrirTurnoCajaUseCase,
      obtenerTurnoActual: obtenerTurnoActualUseCase,
      
    },
  };
}
