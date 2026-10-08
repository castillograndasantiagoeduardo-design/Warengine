// Punto de entrada público de @warengine/contracts.
// Solo expone lo que BACK y FRONT pueden importar.

// ─── Constantes globales ───────────────────────────────────────
export * from './roles.ts';
export * from './permissions.ts';
export * from './tool-names.ts';




// ─── Módulo: autenticacion ─────────────────────────────────────
export * from './autenticacion/login.schema.ts';
export * from './autenticacion/renovar-token.schema.ts';
export * from './administracion/auditoria.schema.ts';
export * from './administracion/auditoria.catalogo.ts';
// ─── Módulo: inventario ────────────────────────────────────────
export * from './inventario/categoria.schema.ts';
export * from './inventario/proveedor.schema.ts';

// ─── Módulo: facturacion ───────────────────────────────────────
export * from './facturacion/cliente.schema.ts';
export * from './facturacion/turno-caja.schema.ts';


// ─── Módulo: administracion ────────────────────────────────────
export * from './administracion/sucursal.schema.ts';
export * from './administracion/usuario.schema.ts';

// ─── Módulo: logistica ─────────────────────────────────────────
// (los esquemas se agregarán cuando se implemente el módulo)

// ─── Módulo: mcp ──────────────────────────────────────────────
// (los esquemas de Tools MCP se agregarán aquí)
