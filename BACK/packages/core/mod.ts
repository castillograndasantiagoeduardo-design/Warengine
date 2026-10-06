/**
 * mod.ts — Punto de entrada de @warengine/core.
 *
 * Exportará los módulos de dominio y aplicación de Warengine:
 *   - autenticacion: Usuario, Rol, Permiso, casos de uso de auth
 *   - inventario:    Producto, Sku, StockSucursal, MovimientoInventario, casos de uso
 *   - facturacion:   Factura, ItemFactura, Pago, TurnoCaja, Cliente, casos de uso
 *   - administracion: Sucursal, Empleado, HistorialSalario, AlertaAdmin, casos de uso
 *   - logistica:     Activo, AsignacionActivo, Mantenimiento, Area, casos de uso
 *   - mcp-audit:     casos de uso de auditoría de Tools del MCP
 *
 * REGLA ABSOLUTA: este paquete no puede importar Drizzle, librerías HTTP,
 * JWT ni ningún detalle de infraestructura. Solo @warengine/shared-kernel
 * y @warengine/contracts.
 */

// ─── Módulo: Autenticación ──────────────────────────────────────────────────
export * from './src/modules/autenticacion/domain/entities/Usuario.ts';
export * from './src/modules/autenticacion/domain/errors/AutenticacionErrors.ts';
export * from './src/modules/autenticacion/domain/repositories/IUsuarioRepository.ts';
export * from './src/modules/autenticacion/domain/repositories/IRolRepository.ts';
export * from './src/modules/autenticacion/domain/repositories/IRefreshTokenRepository.ts';
export * from './src/modules/autenticacion/domain/services/IPasswordService.ts';
export * from './src/modules/autenticacion/domain/services/ITokenService.ts';
export * from './src/modules/autenticacion/application/use-cases/LoginUseCase.ts';
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
export * from './src/modules/administracion/application/use-cases/ListarUsuariosUseCase.ts';

// ─── Módulo: Inventario ─────────────────────────────────────────────────────
export * from './src/modules/inventario/domain/entities/Categoria.ts';
export * from './src/modules/inventario/domain/entities/Proveedor.ts';
export * from './src/modules/inventario/domain/errors/InventarioErrors.ts';
export * from './src/modules/inventario/domain/repositories/ICategoriaRepository.ts';
export * from './src/modules/inventario/domain/repositories/IProveedorRepository.ts';
export * from './src/modules/inventario/application/ports/auditoria.service.ts';
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
