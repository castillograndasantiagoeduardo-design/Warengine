// mod.ts — Punto de entrada de @warengine/core
// Expone entidades, value objects, ports y casos de uso organizados por módulo.
// REGLA: este paquete no implementa nada de infraestructura (DIP).

// ─── Módulo: Autenticación ──────────────────────────────────────────────────
export * from './src/modules/autenticacion/domain/entities/Usuario.ts';
export * from './src/modules/autenticacion/domain/entities/PoliticaBloqueoLogin.ts';
export * from './src/modules/autenticacion/domain/errors/AutenticacionErrors.ts';
export * from './src/modules/autenticacion/domain/repositories/IUsuarioRepository.ts';
export * from './src/modules/autenticacion/domain/repositories/IRolRepository.ts';
export * from './src/modules/autenticacion/domain/repositories/IRefreshTokenRepository.ts';
export * from './src/modules/autenticacion/domain/repositories/IRegistroIntentosLogin.ts';
export * from './src/modules/autenticacion/domain/repositories/IControlIntentosLogin.ts';
export * from './src/modules/autenticacion/domain/services/IPasswordService.ts';
export * from './src/modules/autenticacion/domain/services/ITokenService.ts';
export * from './src/modules/autenticacion/application/use-cases/LoginUseCase.ts';
export * from './src/modules/autenticacion/application/use-cases/LogoutUseCase.ts';
export * from './src/modules/autenticacion/application/use-cases/RenovarTokenUseCase.ts';
export * from './src/modules/autenticacion/application/use-cases/ValidarPermisoUseCase.ts';

// ─── Módulo: Administración ─────────────────────────────────────────────────
export * from './src/modules/administracion/domain/entities/Sucursal.ts';
export * from './src/modules/administracion/domain/entities/UsuarioGestionado.ts';
export * from './src/modules/administracion/domain/errors/AdministracionErrors.ts';
export * from './src/modules/administracion/domain/repositories/ISucursalRepository.ts';
export * from './src/modules/administracion/domain/repositories/IGestionUsuarioRepository.ts';
export * from './src/modules/administracion/application/use-cases/CrearSucursalUseCase.ts';
export * from './src/modules/administracion/application/use-cases/EditarSucursalUseCase.ts';
export * from './src/modules/administracion/application/use-cases/ListarSucursalesUseCase.ts';
export * from './src/modules/administracion/application/use-cases/CrearUsuarioUseCase.ts';
export * from './src/modules/administracion/application/use-cases/CambiarRolUsuarioUseCase.ts';
export * from './src/modules/administracion/application/use-cases/CambiarEstadoUsuarioUseCase.ts';
export * from './src/modules/administracion/application/use-cases/RestablecerPasswordUsuarioUseCase.ts';
export * from './src/modules/administracion/application/use-cases/ListarUsuariosUseCase.ts';

// ─── Módulo: Auditoría ───────────────────────────────────────────────────────
export * from './src/modules/auditoria/domain/entities/LogAuditoria.ts';
export * from './src/modules/auditoria/domain/repositories/IAuditoriaRepository.ts';
export * from './src/modules/auditoria/domain/errors/AuditoriaErrors.ts';
export * from './src/modules/auditoria/domain/services/sanitizar-detalles.ts';
export * from './src/modules/auditoria/application/use-cases/ConsultarAuditoriaUseCase.ts';

// ─── Módulo: Facturación ────────────────────────────────────────────────────
export * from './src/modules/facturacion/domain/entities/Cliente.ts';
export * from './src/modules/facturacion/domain/errors/FacturacionErrors.ts';
export * from './src/modules/facturacion/domain/repositories/IClienteRepository.ts';
export * from './src/modules/facturacion/application/use-cases/RegistrarClienteUseCase.ts';
export * from './src/modules/facturacion/application/use-cases/BuscarClientesUseCase.ts';

// ─── Módulo: Inventario ─────────────────────────────────────────────────────
export * from './src/modules/inventario/domain/entities/Categoria.ts';
export * from './src/modules/inventario/domain/entities/Proveedor.ts';
export * from './src/modules/inventario/domain/errors/InventarioErrors.ts';
export * from './src/modules/inventario/domain/repositories/ICategoriaRepository.ts';
export * from './src/modules/inventario/domain/repositories/IProveedorRepository.ts';
export * from './src/modules/inventario/application/use-cases/ListarCategoriasUseCase.ts';
export * from './src/modules/inventario/application/use-cases/ObtenerCategoriaPorIdUseCase.ts';
export * from './src/modules/inventario/application/use-cases/CrearCategoriaUseCase.ts';
export * from './src/modules/inventario/application/use-cases/EditarCategoriaUseCase.ts';
export * from './src/modules/inventario/application/use-cases/InactivarCategoriaUseCase.ts';
export * from './src/modules/inventario/application/use-cases/ReactivarCategoriaUseCase.ts';
export * from './src/modules/inventario/application/use-cases/CambiarEstadoCategoriaUseCase.ts';
export * from './src/modules/inventario/application/use-cases/ListarProveedoresUseCase.ts';
export * from './src/modules/inventario/application/use-cases/ObtenerProveedorPorIdUseCase.ts';
export * from './src/modules/inventario/application/use-cases/CrearProveedorUseCase.ts';
export * from './src/modules/inventario/application/use-cases/EditarProveedorUseCase.ts';
export * from './src/modules/inventario/application/use-cases/InactivarProveedorUseCase.ts';
export * from './src/modules/inventario/application/use-cases/ReactivarProveedorUseCase.ts';
export * from './src/modules/inventario/application/use-cases/CambiarEstadoProveedorUseCase.ts';
