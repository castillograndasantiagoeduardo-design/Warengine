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
import { DrizzleMovimientoInventarioRepository } from '../../database/src/repositories/inventario/drizzle-movimiento-inventario.repository.ts';
import { DrizzleInventarioSucursalRepository } from '../../database/src/repositories/inventario/drizzle-inventario-sucursal.repository.ts';
import { DrizzleTurnoCajaRepository } from '../../database/src/repositories/facturacion/drizzle-turno-caja.repository.ts';
import { DrizzleUsuarioSucursalRepository } from '../../database/src/repositories/administracion/drizzle-usuario-sucursal.repository.ts';
import { DrizzleSucursalesAutorizadasRepository } from '../../database/src/repositories/autenticacion/drizzle-sucursales-autorizadas.repository.ts';
import { DrizzlePerfilSesionRepository } from '../../database/src/repositories/autenticacion/drizzle-perfil-sesion.repository.ts';
import { DrizzleAlertaStockRepository } from '../../database/src/repositories/administracion/drizzle-alerta-stock.repository.ts';
import { DrizzleAreaRepository } from '../../database/src/repositories/administracion/drizzle-area.repository.ts';
import { DrizzleEmpleadoRepository } from '../../database/src/repositories/administracion/drizzle-empleado.repository.ts';
import { DrizzleHistorialSalarioRepository } from '../../database/src/repositories/administracion/drizzle-historial-salario.repository.ts';
import { DrizzleAlertaAdminRepository } from '../../database/src/repositories/administracion/drizzle-alerta-admin.repository.ts';
import { DrizzleMetricasAdminRepository } from '../../database/src/repositories/administracion/drizzle-metricas-admin.repository.ts';



import { DrizzleSucursalOperadorRepository } from '../../database/src/repositories/facturacion/drizzle-sucursal-operador.repository.ts';
import { DrizzleFacturaRepository } from '../../database/src/repositories/facturacion/drizzle-factura.repository.ts';
import { DrizzleDevolucionVentaRepository } from '../../database/src/repositories/facturacion/drizzle-devolucion-venta.repository.ts';
import { DrizzlePasswordResetRepository } from '../../database/src/repositories/autenticacion/drizzle-password-reset.repository.ts';
import { DrizzleLogMcpToolRepository } from '../../database/src/repositories/mcp-audit/drizzle-log-mcp-tool.repository.ts';
import { DrizzleCategoriaActivoRepository } from '../../database/src/repositories/logistica/drizzle-categoria-activo.repository.ts';
import { DrizzleActivoRepository } from '../../database/src/repositories/logistica/drizzle-activo.repository.ts';
import { DrizzleAsignacionActivoRepository } from '../../database/src/repositories/logistica/drizzle-asignacion-activo.repository.ts';
import { DrizzleMantenimientoActivoRepository } from '../../database/src/repositories/logistica/drizzle-mantenimiento-activo.repository.ts';



import { JwtTokenService } from '../../platform/src/jwt/jwt-token-service.ts';
import { Argon2PasswordHasher } from '../../platform/src/hashing/argon2-password-hasher.ts';
import { TotpService } from '../../platform/src/totp/totp-service.ts';
import { PlatformMailer } from '../../platform/src/mailer/mailer.ts';
import { GeminiAsistenteService } from '../../platform/src/asistente/gemini-asistente.service.ts';
import { validarYObtenerJwtSecret } from '../../platform/src/config/jwt.config.ts';




import {
  LoginUseCase,
  LogoutUseCase,
  PoliticaBloqueoLogin,
  ValidarPermisoUseCase,
  RenovarTokenUseCase,
  Configurar2FAUseCase,
  Activar2FAUseCase,
  Verificar2FALoginUseCase,
  Desactivar2FAUseCase,
  SolicitarRecuperacionPasswordUseCase,
  ValidarTokenPasswordResetUseCase,
  RestablecerPasswordUseCase,
  ObtenerSesionActualUseCase,

  ListarSucursalesUseCase,
  CrearSucursalUseCase,
  EditarSucursalUseCase,
  ObtenerDetalleSucursalUseCase,
  ListarAreasPorSucursalUseCase,
  CrearAreaUseCase,
  EditarAreaUseCase,
  EliminarAreaUseCase,
  ListarEmpleadosUseCase,
  ObtenerEmpleadoPorIdUseCase,
  EditarEmpleadoUseCase,
  ListarUsuariosUseCase,
  ListarRolesUseCase,
  CrearUsuarioUseCase,
  CambiarRolUsuarioUseCase,
  CambiarEstadoUsuarioUseCase,
  RegistrarClienteUseCase,
  ActualizarClienteUseCase,
  ObtenerClientePorIdUseCase,
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
  ExportarAuditoriaCsvUseCase,
  ListarProductosUseCase,
  ObtenerProductoPorIdUseCase,
  CrearProductoUseCase,
  EditarProductoUseCase,
  InactivarProductoUseCase,
  ReactivarProductoUseCase,
  CambiarEstadoProductoUseCase,
  RestablecerPasswordUsuarioUseCase,
  AbrirTurnoCajaUseCase,
  CerrarTurnoCajaUseCase,
  ObtenerTurnoActualUseCase,
  ListarTurnosAbiertosUseCase,
  AsignarSucursalesUsuarioUseCase,
  ObtenerSucursalesUsuarioUseCase,
  ResolverAlcanceSucursalUseCase,
  ConsultarAlertasStockUseCase,
  RegistrarAumentoSalarioUseCase,
  ConsultarHistorialSalariosUseCase,
  CrearAlertaAdminUseCase,
  ListarAlertasAdminUseCase,
  AtenderAlertaAdminUseCase,
  ConsultarMetricasGananciasUseCase,
  ConsultarTendenciasVentasUseCase,
  ConsultarRendimientoSucursalesUseCase,
  ConsultarRankingProductosUseCase,
  ConsultarComparativoInventarioUseCase,
  ConsultarResumenDashboardUseCase,
  CrearFacturaUseCase,
  ListarFacturasUseCase,
  ObtenerFacturaPorIdUseCase,
  EmitirAlertaFacturacionUseCase,
  AnularFacturaUseCase,
  RegistrarEntradaInventarioUseCase,
  RegistrarSalidaInventarioUseCase,
  ConsultarKardexUseCase,
  ConfigurarStockMinimoUseCase,
  ConsultarStockSucursalUseCase,
  ConsultarHistorialPreciosUseCase,
  ListarEntradasInventarioUseCase,
  ObtenerEntradaInventarioPorIdUseCase,
  AnularEntradaInventarioUseCase,
  AjustarInventarioUseCase,
  TransferirMercanciaUseCase,
  ImportarProductosUseCase,
  ExportarProductosCsvUseCase,
  ExportarKardexCsvUseCase,
  RegistrarLogMcpToolUseCase,
  ConsultarLogsMcpToolsUseCase,
  ConversarConAsistenteUseCase,
  CrearCategoriaActivoUseCase,
  ListarCategoriasActivosUseCase,
  EditarCategoriaActivoUseCase,
  CambiarEstadoCategoriaActivoUseCase,
  CrearActivoUseCase,
  ListarActivosUseCase,
  DarBajaActivoUseCase,
  AsignarActivoEmpleadoUseCase,
  AsignarActivoAreaUseCase,
  DevolverActivoUseCase,
  ConsultarHistorialAsignacionesUseCase,
  RegistrarMantenimientoUseCase,
  FinalizarMantenimientoUseCase,
  ConsultarHistorialMantenimientosUseCase,
  ConsultarActivoUseCase,
  RegistrarDevolucionUseCase,
  
  
} from '@warengine/core';

export interface AppContainer {
  autenticacion: {
    login: LoginUseCase;
    logout: LogoutUseCase;
    validarPermiso: ValidarPermisoUseCase;
    renovarToken: RenovarTokenUseCase;
    resolverAlcanceSucursal: ResolverAlcanceSucursalUseCase;
    configurar2FA: Configurar2FAUseCase;
    activar2FA: Activar2FAUseCase;
    verificar2FALogin: Verificar2FALoginUseCase;
    desactivar2FA: Desactivar2FAUseCase;
    solicitarRecuperacionPassword: SolicitarRecuperacionPasswordUseCase;
    validarTokenPasswordReset: ValidarTokenPasswordResetUseCase;
    restablecerPassword: RestablecerPasswordUseCase;
    obtenerSesionActual: ObtenerSesionActualUseCase;
  };

  administracion: {
    listarSucursales: ListarSucursalesUseCase;
    obtenerDetalleSucursal: ObtenerDetalleSucursalUseCase;
    crearSucursal: CrearSucursalUseCase;
    editarSucursal: EditarSucursalUseCase;
    listarAreasPorSucursal: ListarAreasPorSucursalUseCase;
    crearArea: CrearAreaUseCase;
    editarArea: EditarAreaUseCase;
    eliminarArea: EliminarAreaUseCase;
    listarEmpleados: ListarEmpleadosUseCase;
    obtenerEmpleadoPorId: ObtenerEmpleadoPorIdUseCase;
    editarEmpleado: EditarEmpleadoUseCase;
    listarUsuarios: ListarUsuariosUseCase;
    listarRoles: ListarRolesUseCase;
    crearUsuario: CrearUsuarioUseCase;
    cambiarRolUsuario: CambiarRolUsuarioUseCase;
    cambiarEstadoUsuario: CambiarEstadoUsuarioUseCase;
    consultarAuditoria: ConsultarAuditoriaUseCase;
    exportarAuditoriaCsv: ExportarAuditoriaCsvUseCase;
    restablecerPasswordUsuario: RestablecerPasswordUsuarioUseCase;
    asignarSucursalesUsuario: AsignarSucursalesUsuarioUseCase;
    obtenerSucursalesUsuario: ObtenerSucursalesUsuarioUseCase;
    consultarAlertasStock: ConsultarAlertasStockUseCase;
    registrarAumentoSalario: RegistrarAumentoSalarioUseCase;
    consultarHistorialSalarios: ConsultarHistorialSalariosUseCase;
    crearAlertaAdmin: CrearAlertaAdminUseCase;
    listarAlertasAdmin: ListarAlertasAdminUseCase;
    atenderAlertaAdmin: AtenderAlertaAdminUseCase;
    consultarMetricasGanancias: ConsultarMetricasGananciasUseCase;
    consultarTendenciasVentas: ConsultarTendenciasVentasUseCase;
    consultarRendimientoSucursales: ConsultarRendimientoSucursalesUseCase;
    consultarRankingProductos: ConsultarRankingProductosUseCase;
    consultarComparativoInventario: ConsultarComparativoInventarioUseCase;
    consultarResumenDashboard: ConsultarResumenDashboardUseCase;
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
    registrarEntrada: RegistrarEntradaInventarioUseCase;
    registrarSalida: RegistrarSalidaInventarioUseCase;
    consultarKardex: ConsultarKardexUseCase;
    configurarStockMinimo: ConfigurarStockMinimoUseCase;
    consultarStockSucursal: ConsultarStockSucursalUseCase;
    consultarHistorialPrecios: ConsultarHistorialPreciosUseCase;
    listarEntradas: ListarEntradasInventarioUseCase;
    obtenerEntradaPorId: ObtenerEntradaInventarioPorIdUseCase;
    anularEntrada: AnularEntradaInventarioUseCase;
    ajustarInventario: AjustarInventarioUseCase;
    transferirMercancia: TransferirMercanciaUseCase;
    importarProductos: ImportarProductosUseCase;
    exportarProductosCsv: ExportarProductosCsvUseCase;
    exportarKardexCsv: ExportarKardexCsvUseCase;
  };
  facturacion: {
    registrarCliente: RegistrarClienteUseCase;
    actualizarCliente: ActualizarClienteUseCase;
    obtenerClientePorId: ObtenerClientePorIdUseCase;
    buscarClientes: BuscarClientesUseCase;
    abrirTurnoCaja: AbrirTurnoCajaUseCase;
    cerrarTurnoCaja: CerrarTurnoCajaUseCase;
    obtenerTurnoActual: ObtenerTurnoActualUseCase;
    listarTurnosAbiertos: ListarTurnosAbiertosUseCase;
    crearFactura: CrearFacturaUseCase;
    listarFacturas: ListarFacturasUseCase;
    obtenerFacturaPorId: ObtenerFacturaPorIdUseCase;
    emitirAlertaFacturacion: EmitirAlertaFacturacionUseCase;
    anularFactura: AnularFacturaUseCase;
    registrarDevolucion: RegistrarDevolucionUseCase;
  };
  logistica: {
    crearCategoriaActivo: CrearCategoriaActivoUseCase;
    listarCategoriasActivos: ListarCategoriasActivosUseCase;
    editarCategoriaActivo: EditarCategoriaActivoUseCase;
    cambiarEstadoCategoriaActivo: CambiarEstadoCategoriaActivoUseCase;
    crearActivo: CrearActivoUseCase;
    listarActivos: ListarActivosUseCase;
    darBajaActivo: DarBajaActivoUseCase;
    asignarActivoEmpleado: AsignarActivoEmpleadoUseCase;
    asignarActivoArea: AsignarActivoAreaUseCase;
    devolverActivo: DevolverActivoUseCase;
    consultarHistorialAsignaciones: ConsultarHistorialAsignacionesUseCase;
    registrarMantenimiento: RegistrarMantenimientoUseCase;
    finalizarMantenimiento: FinalizarMantenimientoUseCase;
    consultarHistorialMantenimientos: ConsultarHistorialMantenimientosUseCase;
    consultarActivo: ConsultarActivoUseCase;
  };
  mcp: {
    registrarLog: RegistrarLogMcpToolUseCase;
    consultarLogs: ConsultarLogsMcpToolsUseCase;
  };
  asistente: {
    conversar: ConversarConAsistenteUseCase;
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
  const areaRepository = new DrizzleAreaRepository(db);
  const empleadoRepository = new DrizzleEmpleadoRepository(db);
  const historialSalarioRepository = new DrizzleHistorialSalarioRepository(db);
  const gestionUsuarioRepository = new DrizzleGestionUsuarioRepository(db);
  const clienteRepository = new DrizzleClienteRepository(db);
  const categoriaRepository = new DrizzleCategoriaRepository(db);
  const proveedorRepository = new DrizzleProveedorRepository(db);
  const productoRepository = new DrizzleProductoRepository(db);
  const movimientoInventarioRepository = new DrizzleMovimientoInventarioRepository(db);
  const inventarioSucursalRepository = new DrizzleInventarioSucursalRepository(db);
  const usuarioSucursalRepository = new DrizzleUsuarioSucursalRepository(db);
  const auditoriaRepository = new DrizzleAuditoriaRepository(db);
  const sucursalesAutorizadasRepository = new DrizzleSucursalesAutorizadasRepository(db);
  const perfilSesionRepository = new DrizzlePerfilSesionRepository(db);
  const alertaStockRepository = new DrizzleAlertaStockRepository(db);
  const alertaAdminRepository = new DrizzleAlertaAdminRepository(db);
  const metricasAdminRepository = new DrizzleMetricasAdminRepository(db);
  const turnoCajaRepository = new DrizzleTurnoCajaRepository(db);
  const sucursalOperadorRepository = new DrizzleSucursalOperadorRepository(db);
  const facturaRepository = new DrizzleFacturaRepository(db);
  const devolucionVentaRepository = new DrizzleDevolucionVentaRepository(db);
  const passwordResetRepository = new DrizzlePasswordResetRepository(db);
  const categoriaActivoRepository = new DrizzleCategoriaActivoRepository(db);
  const activoRepository = new DrizzleActivoRepository(db);
  const asignacionActivoRepository = new DrizzleAsignacionActivoRepository(db);
  const mantenimientoActivoRepository = new DrizzleMantenimientoActivoRepository(db);
  // 2. Instanciar Servicios Técnicos
  const tokenService = new JwtTokenService(refreshTokenRepository, jwtSecret);
  const passwordHasher = new Argon2PasswordHasher();
  const totpService = new TotpService();
  const mailer = new PlatformMailer(getEnv('FRONTEND_URL') ?? 'http://localhost:3000');

  // 3. Instanciar Casos de Uso
  const loginUseCase = new LoginUseCase(
    usuarioRepository,
    passwordHasher,
    tokenService,
    intentoLoginRepository,
    intentoLoginRepository,
    rolRepository,
    politicaBloqueo,
    perfilSesionRepository,
  );
  const logoutUseCase = new LogoutUseCase(tokenService);
  const configurar2FAUseCase = new Configurar2FAUseCase(usuarioRepository, totpService);
  const activar2FAUseCase = new Activar2FAUseCase(usuarioRepository, totpService, auditoriaRepository);
  const verificar2FALoginUseCase = new Verificar2FALoginUseCase(
    usuarioRepository,
    totpService,
    tokenService,
    intentoLoginRepository,
    rolRepository,
    perfilSesionRepository,
  );
  const obtenerSesionActualUseCase = new ObtenerSesionActualUseCase(
    usuarioRepository,
    rolRepository,
    perfilSesionRepository,
  );
  const desactivar2FAUseCase = new Desactivar2FAUseCase(
    usuarioRepository,
    passwordHasher,
    auditoriaRepository,
  );
  const solicitarRecuperacionPasswordUseCase = new SolicitarRecuperacionPasswordUseCase(
    usuarioRepository,
    passwordResetRepository,
    mailer,
    auditoriaRepository,
  );
  const validarTokenPasswordResetUseCase = new ValidarTokenPasswordResetUseCase(
    passwordResetRepository,
  );
  const restablecerPasswordUseCase = new RestablecerPasswordUseCase(
    passwordResetRepository,
    usuarioRepository,
    passwordHasher,
    auditoriaRepository,
  );

  const validarPermisoUseCase = new ValidarPermisoUseCase(
    tokenService,
    usuarioRepository,
    rolRepository,
    auditoriaRepository,
  );
  const renovarTokenUseCase = new RenovarTokenUseCase(tokenService, usuarioRepository);

  const resolverAlcanceSucursalUseCase = new ResolverAlcanceSucursalUseCase(
    usuarioRepository,
    rolRepository,
    sucursalesAutorizadasRepository,
  );

  const listarSucursalesUseCase = new ListarSucursalesUseCase(sucursalRepository);
  const obtenerDetalleSucursalUseCase = new ObtenerDetalleSucursalUseCase(sucursalRepository);
  const crearSucursalUseCase = new CrearSucursalUseCase(sucursalRepository, auditoriaRepository);
  const editarSucursalUseCase = new EditarSucursalUseCase(sucursalRepository, auditoriaRepository);

  const listarAreasPorSucursalUseCase = new ListarAreasPorSucursalUseCase(
    areaRepository,
    sucursalRepository,
  );
  const crearAreaUseCase = new CrearAreaUseCase(
    areaRepository,
    sucursalRepository,
    auditoriaRepository,
  );
  const editarAreaUseCase = new EditarAreaUseCase(areaRepository, auditoriaRepository);
  const eliminarAreaUseCase = new EliminarAreaUseCase(areaRepository, auditoriaRepository);

  const listarEmpleadosUseCase = new ListarEmpleadosUseCase(empleadoRepository, resolverAlcanceSucursalUseCase);
  const obtenerEmpleadoPorIdUseCase = new ObtenerEmpleadoPorIdUseCase(empleadoRepository, resolverAlcanceSucursalUseCase);
  const editarEmpleadoUseCase = new EditarEmpleadoUseCase(
    empleadoRepository,
    areaRepository,
    auditoriaRepository,
    resolverAlcanceSucursalUseCase,
  );
  const registrarAumentoSalarioUseCase = new RegistrarAumentoSalarioUseCase(
    empleadoRepository,
    historialSalarioRepository,
    auditoriaRepository,
  );
  const consultarHistorialSalariosUseCase = new ConsultarHistorialSalariosUseCase(
    empleadoRepository,
    historialSalarioRepository,
  );
  const crearAlertaAdminUseCase = new CrearAlertaAdminUseCase(
    sucursalRepository,
    alertaAdminRepository,
    auditoriaRepository,
  );
  const listarAlertasAdminUseCase = new ListarAlertasAdminUseCase(
    resolverAlcanceSucursalUseCase,
    alertaAdminRepository,
  );
  const atenderAlertaAdminUseCase = new AtenderAlertaAdminUseCase(
    alertaAdminRepository,
    auditoriaRepository,
  );

  const listarUsuariosUseCase = new ListarUsuariosUseCase(gestionUsuarioRepository);
  const listarRolesUseCase = new ListarRolesUseCase(rolRepository);
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
  const consultarAlertasStockUseCase = new ConsultarAlertasStockUseCase(
    resolverAlcanceSucursalUseCase,
    alertaStockRepository,
  );
  const obtenerTurnoActualUseCase = new ObtenerTurnoActualUseCase(turnoCajaRepository);
  const listarTurnosAbiertosUseCase = new ListarTurnosAbiertosUseCase(
    resolverAlcanceSucursalUseCase,
    turnoCajaRepository,
  );
  const cerrarTurnoCajaUseCase = new CerrarTurnoCajaUseCase(turnoCajaRepository, auditoriaRepository);
  const crearFacturaUseCase = new CrearFacturaUseCase(
    facturaRepository,
    turnoCajaRepository,
    clienteRepository,
    sucursalOperadorRepository,
    auditoriaRepository,
  );
  const listarFacturasUseCase = new ListarFacturasUseCase(
    facturaRepository,
    sucursalOperadorRepository,
  );
  const obtenerFacturaPorIdUseCase = new ObtenerFacturaPorIdUseCase(
    facturaRepository,
    sucursalOperadorRepository,
  );
  const emitirAlertaFacturacionUseCase = new EmitirAlertaFacturacionUseCase(
    alertaAdminRepository,
    sucursalOperadorRepository,
    auditoriaRepository,
  );
  const anularFacturaUseCase = new AnularFacturaUseCase(
    facturaRepository,
    sucursalOperadorRepository,
    auditoriaRepository,
  );
  const registrarDevolucionUseCase = new RegistrarDevolucionUseCase(
    facturaRepository,
    devolucionVentaRepository,
    sucursalOperadorRepository,
    auditoriaRepository,
  );
  const consultarAuditoriaUseCase = new ConsultarAuditoriaUseCase(auditoriaRepository);
  const exportarAuditoriaCsvUseCase = new ExportarAuditoriaCsvUseCase(auditoriaRepository);
  

  // Casos de uso de Categorías
  const listarCategoriasUseCase = new ListarCategoriasUseCase(categoriaRepository);
  const obtenerCategoriaPorIdUseCase = new ObtenerCategoriaPorIdUseCase(categoriaRepository);
  const crearCategoriaUseCase = new CrearCategoriaUseCase(categoriaRepository, auditoriaRepository);
  const editarCategoriaUseCase = new EditarCategoriaUseCase(categoriaRepository, auditoriaRepository);
  const inactivarCategoriaUseCase = new InactivarCategoriaUseCase(
    categoriaRepository,
    auditoriaRepository,
    productoRepository,
  );
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
  const inactivarProveedorUseCase = new InactivarProveedorUseCase(
    proveedorRepository,
    auditoriaRepository,
    productoRepository,
  );
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
  const consultarHistorialPreciosUseCase = new ConsultarHistorialPreciosUseCase(
    productoRepository,
    auditoriaRepository,
  );
  const importarProductosUseCase = new ImportarProductosUseCase(
    productoRepository,
    categoriaRepository,
    proveedorRepository,
    auditoriaRepository,
  );

  const registrarEntradaInventarioUseCase = new RegistrarEntradaInventarioUseCase(
    movimientoInventarioRepository,
    productoRepository,
    sucursalRepository,
    proveedorRepository,
    auditoriaRepository,
    resolverAlcanceSucursalUseCase,
  );
  const registrarSalidaInventarioUseCase = new RegistrarSalidaInventarioUseCase(
    movimientoInventarioRepository,
    productoRepository,
    sucursalRepository,
    auditoriaRepository,
    resolverAlcanceSucursalUseCase,
  );
  const consultarKardexUseCase = new ConsultarKardexUseCase(
    movimientoInventarioRepository,
    resolverAlcanceSucursalUseCase,
  );
  const listarEntradasUseCase = new ListarEntradasInventarioUseCase(
    movimientoInventarioRepository,
    resolverAlcanceSucursalUseCase,
  );
  const obtenerEntradaPorIdUseCase = new ObtenerEntradaInventarioPorIdUseCase(
    movimientoInventarioRepository,
    resolverAlcanceSucursalUseCase,
  );
  const anularEntradaUseCase = new AnularEntradaInventarioUseCase(
    movimientoInventarioRepository,
    auditoriaRepository,
    resolverAlcanceSucursalUseCase,
  );
  const ajustarInventarioUseCase = new AjustarInventarioUseCase(
    movimientoInventarioRepository,
    productoRepository,
    sucursalRepository,
    auditoriaRepository,
    resolverAlcanceSucursalUseCase,
  );
  const transferirMercanciaUseCase = new TransferirMercanciaUseCase(
    movimientoInventarioRepository,
    productoRepository,
    sucursalRepository,
    auditoriaRepository,
    resolverAlcanceSucursalUseCase,
  );
  const configurarStockMinimoUseCase = new ConfigurarStockMinimoUseCase(
    inventarioSucursalRepository,
    productoRepository,
    sucursalRepository,
    auditoriaRepository,
    resolverAlcanceSucursalUseCase,
  );
  const consultarStockSucursalUseCase = new ConsultarStockSucursalUseCase(
    inventarioSucursalRepository,
    productoRepository,
    sucursalRepository,
    resolverAlcanceSucursalUseCase,
  );
  const exportarProductosCsvUseCase = new ExportarProductosCsvUseCase(productoRepository);
  const exportarKardexCsvUseCase = new ExportarKardexCsvUseCase(
    movimientoInventarioRepository,
    resolverAlcanceSucursalUseCase,
  );

  // Casos de uso de Logística (Activos fijos)
  const crearCategoriaActivoUseCase = new CrearCategoriaActivoUseCase(categoriaActivoRepository, auditoriaRepository);
  const listarCategoriasActivosUseCase = new ListarCategoriasActivosUseCase(categoriaActivoRepository);
  const editarCategoriaActivoUseCase = new EditarCategoriaActivoUseCase(categoriaActivoRepository, auditoriaRepository);
  const cambiarEstadoCategoriaActivoUseCase = new CambiarEstadoCategoriaActivoUseCase(categoriaActivoRepository, auditoriaRepository);
  const crearActivoUseCase = new CrearActivoUseCase(
    activoRepository,
    categoriaActivoRepository,
    sucursalRepository,
    resolverAlcanceSucursalUseCase,
    auditoriaRepository,
  );
  const listarActivosUseCase = new ListarActivosUseCase(activoRepository, resolverAlcanceSucursalUseCase);
  const darBajaActivoUseCase = new DarBajaActivoUseCase(activoRepository, resolverAlcanceSucursalUseCase, auditoriaRepository);
  const asignarActivoEmpleadoUseCase = new AsignarActivoEmpleadoUseCase(
    activoRepository,
    asignacionActivoRepository,
    empleadoRepository,
    resolverAlcanceSucursalUseCase,
    auditoriaRepository,
  );
  const asignarActivoAreaUseCase = new AsignarActivoAreaUseCase(
    activoRepository,
    asignacionActivoRepository,
    areaRepository,
    resolverAlcanceSucursalUseCase,
    auditoriaRepository,
  );
  const devolverActivoUseCase = new DevolverActivoUseCase(
    activoRepository,
    asignacionActivoRepository,
    resolverAlcanceSucursalUseCase,
    auditoriaRepository,
  );
  const consultarHistorialAsignacionesUseCase = new ConsultarHistorialAsignacionesUseCase(
    activoRepository,
    asignacionActivoRepository,
    resolverAlcanceSucursalUseCase,
  );
  const registrarMantenimientoUseCase = new RegistrarMantenimientoUseCase(
    activoRepository,
    mantenimientoActivoRepository,
    proveedorRepository,
    resolverAlcanceSucursalUseCase,
    auditoriaRepository,
  );
  const finalizarMantenimientoUseCase = new FinalizarMantenimientoUseCase(
    activoRepository,
    mantenimientoActivoRepository,
    resolverAlcanceSucursalUseCase,
    auditoriaRepository,
  );
  const consultarHistorialMantenimientosUseCase = new ConsultarHistorialMantenimientosUseCase(
    activoRepository,
    mantenimientoActivoRepository,
    resolverAlcanceSucursalUseCase,
  );
  const consultarActivoUseCase = new ConsultarActivoUseCase(
    activoRepository,
    asignacionActivoRepository,
    mantenimientoActivoRepository,
    resolverAlcanceSucursalUseCase,
  );

  const registrarClienteUseCase = new RegistrarClienteUseCase(clienteRepository, auditoriaRepository);
  const actualizarClienteUseCase = new ActualizarClienteUseCase(clienteRepository, auditoriaRepository);
  const obtenerClientePorIdUseCase = new ObtenerClientePorIdUseCase(clienteRepository);
  const buscarClientesUseCase = new BuscarClientesUseCase(clienteRepository);

  const logMcpToolRepository = new DrizzleLogMcpToolRepository(db);
  const registrarLogMcpToolUseCase = new RegistrarLogMcpToolUseCase(logMcpToolRepository);
  const consultarLogsMcpToolsUseCase = new ConsultarLogsMcpToolsUseCase(logMcpToolRepository);

  const asistenteService = new GeminiAsistenteService({
    apiKey: getEnv('GEMINI_API_KEY'),
    modelName: getEnv('GEMINI_MODEL'),
    mcpServerUrl: getEnv('MCP_SERVER_URL'),
  });
  const conversarConAsistenteUseCase = new ConversarConAsistenteUseCase(asistenteService);

  return {
    autenticacion: {
      login: loginUseCase,
      logout: logoutUseCase,
      validarPermiso: validarPermisoUseCase,
      renovarToken: renovarTokenUseCase,
      resolverAlcanceSucursal: resolverAlcanceSucursalUseCase,
      configurar2FA: configurar2FAUseCase,
      activar2FA: activar2FAUseCase,
      verificar2FALogin: verificar2FALoginUseCase,
      desactivar2FA: desactivar2FAUseCase,
      solicitarRecuperacionPassword: solicitarRecuperacionPasswordUseCase,
      validarTokenPasswordReset: validarTokenPasswordResetUseCase,
      restablecerPassword: restablecerPasswordUseCase,
      obtenerSesionActual: obtenerSesionActualUseCase,
    },

    administracion: {
      listarSucursales: listarSucursalesUseCase,
      obtenerDetalleSucursal: obtenerDetalleSucursalUseCase,
      crearSucursal: crearSucursalUseCase,
      editarSucursal: editarSucursalUseCase,
      listarAreasPorSucursal: listarAreasPorSucursalUseCase,
      crearArea: crearAreaUseCase,
      editarArea: editarAreaUseCase,
      eliminarArea: eliminarAreaUseCase,
      listarEmpleados: listarEmpleadosUseCase,
      obtenerEmpleadoPorId: obtenerEmpleadoPorIdUseCase,
      editarEmpleado: editarEmpleadoUseCase,
      listarUsuarios: listarUsuariosUseCase,
      listarRoles: listarRolesUseCase,
      crearUsuario: crearUsuarioUseCase,
      cambiarRolUsuario: cambiarRolUsuarioUseCase,
      cambiarEstadoUsuario: cambiarEstadoUsuarioUseCase,
      consultarAuditoria: consultarAuditoriaUseCase,
      exportarAuditoriaCsv: exportarAuditoriaCsvUseCase,
      restablecerPasswordUsuario: restablecerPasswordUsuarioUseCase,
      consultarAlertasStock: consultarAlertasStockUseCase,
      asignarSucursalesUsuario: asignarSucursalesUsuarioUseCase,
      obtenerSucursalesUsuario: obtenerSucursalesUsuarioUseCase,
      registrarAumentoSalario: registrarAumentoSalarioUseCase,
      consultarHistorialSalarios: consultarHistorialSalariosUseCase,
      crearAlertaAdmin: crearAlertaAdminUseCase,
      listarAlertasAdmin: listarAlertasAdminUseCase,
      atenderAlertaAdmin: atenderAlertaAdminUseCase,
      consultarMetricasGanancias: new ConsultarMetricasGananciasUseCase(
        resolverAlcanceSucursalUseCase,
        metricasAdminRepository,
      ),
      consultarTendenciasVentas: new ConsultarTendenciasVentasUseCase(
        resolverAlcanceSucursalUseCase,
        metricasAdminRepository,
      ),
      consultarRendimientoSucursales: new ConsultarRendimientoSucursalesUseCase(
        resolverAlcanceSucursalUseCase,
        metricasAdminRepository,
      ),
      consultarRankingProductos: new ConsultarRankingProductosUseCase(
        resolverAlcanceSucursalUseCase,
        metricasAdminRepository,
      ),
      consultarComparativoInventario: new ConsultarComparativoInventarioUseCase(
        resolverAlcanceSucursalUseCase,
        metricasAdminRepository,
      ),
      consultarResumenDashboard: new ConsultarResumenDashboardUseCase(
        metricasAdminRepository,
        metricasAdminRepository,
      ),
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
      registrarEntrada: registrarEntradaInventarioUseCase,
      registrarSalida: registrarSalidaInventarioUseCase,
      consultarKardex: consultarKardexUseCase,
      configurarStockMinimo: configurarStockMinimoUseCase,
      consultarStockSucursal: consultarStockSucursalUseCase,
      consultarHistorialPrecios: consultarHistorialPreciosUseCase,
      listarEntradas: listarEntradasUseCase,
      obtenerEntradaPorId: obtenerEntradaPorIdUseCase,
      anularEntrada: anularEntradaUseCase,
      ajustarInventario: ajustarInventarioUseCase,
      transferirMercancia: transferirMercanciaUseCase,
      importarProductos: importarProductosUseCase,
      exportarProductosCsv: exportarProductosCsvUseCase,
      exportarKardexCsv: exportarKardexCsvUseCase,
    },
    facturacion: {
      registrarCliente: registrarClienteUseCase,
      actualizarCliente: actualizarClienteUseCase,
      obtenerClientePorId: obtenerClientePorIdUseCase,
      buscarClientes: buscarClientesUseCase,
      abrirTurnoCaja: abrirTurnoCajaUseCase,
      cerrarTurnoCaja: cerrarTurnoCajaUseCase,
      obtenerTurnoActual: obtenerTurnoActualUseCase,
      listarTurnosAbiertos: listarTurnosAbiertosUseCase,
      crearFactura: crearFacturaUseCase,
      listarFacturas: listarFacturasUseCase,
      obtenerFacturaPorId: obtenerFacturaPorIdUseCase,
      emitirAlertaFacturacion: emitirAlertaFacturacionUseCase,
      anularFactura: anularFacturaUseCase,
      registrarDevolucion: registrarDevolucionUseCase,
    },  
    logistica: {
      crearCategoriaActivo: crearCategoriaActivoUseCase,
      listarCategoriasActivos: listarCategoriasActivosUseCase,
      editarCategoriaActivo: editarCategoriaActivoUseCase,
      cambiarEstadoCategoriaActivo: cambiarEstadoCategoriaActivoUseCase,
      crearActivo: crearActivoUseCase,
      listarActivos: listarActivosUseCase,
      darBajaActivo: darBajaActivoUseCase,
      asignarActivoEmpleado: asignarActivoEmpleadoUseCase,
      asignarActivoArea: asignarActivoAreaUseCase,
      devolverActivo: devolverActivoUseCase,
      consultarHistorialAsignaciones: consultarHistorialAsignacionesUseCase,
      registrarMantenimiento: registrarMantenimientoUseCase,
      finalizarMantenimiento: finalizarMantenimientoUseCase,
      consultarHistorialMantenimientos: consultarHistorialMantenimientosUseCase,
      consultarActivo: consultarActivoUseCase,
    },
    mcp: {
      registrarLog: registrarLogMcpToolUseCase,
      consultarLogs: consultarLogsMcpToolsUseCase,
    },
    asistente: {
      conversar: conversarConAsistenteUseCase,
    },
  };
}
