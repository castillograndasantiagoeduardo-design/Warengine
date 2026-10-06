// Punto de entrada público de @warengine/contracts.
// Solo expone lo que BACK y FRONT pueden importar.

// ─── Constantes globales ───────────────────────────────────────
export * from './roles.ts';
export * from './permissions.ts';
export * from './tool-names.ts';




// ─── Módulo: autenticacion ─────────────────────────────────────
export * from './autenticacion/login.schema.ts';
export * from './autenticacion/renovar-token.schema.ts';
// ─── Módulo: inventario ────────────────────────────────────────
// (los esquemas se agregarán cuando se implemente el módulo)

// ─── Módulo: facturacion ───────────────────────────────────────
export * from './facturacion/cliente.schema.ts';


// ─── Módulo: administracion ────────────────────────────────────
export * from './administracion/sucursal.schema.ts';
export * from './administracion/usuario.schema.ts';

// ─── Módulo: logistica ─────────────────────────────────────────
// (los esquemas se agregarán cuando se implemente el módulo)

// ─── Módulo: mcp ──────────────────────────────────────────────
// (los esquemas de Tools MCP se agregarán aquí)
