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
