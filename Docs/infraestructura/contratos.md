# Infraestructura: Contratos Compartidos (`@warengine/contracts`)

> **Paquete:** `Shared/contracts`  
> **Dependencias externas:** Exclusivamente `zod` (`^3.24.1`). Cero dependencias de Node.js, Deno, React o bases de datos.  
> **Consumidores:** `Backend` (validación de payloads de entrada en controladores HTTP) y `Frontend` (validación de formularios y tipado de peticiones).

---

## 1. Propósito y Reglas de Arquitectura

El paquete `@warengine/contracts` es el único punto de contacto en tiempo de compilación entre el Backend y el Frontend. 

### Reglas estrictas:
1. **Solo esquemas y constantes:** Contiene exclusivamente esquemas de validación Zod, tipos inferidos de TypeScript (`z.infer<typeof schema>`) y diccionarios de constantes inmutables (`as const`).
2. **Sin código ejecutable de lógica:** Prohibido implementar funciones de lógica de negocio o acceso a datos.
3. **Independencia de Runtime:** Debe compilar y funcionar de forma idéntica bajo Deno (Backend) y bajo Node.js / Next.js (Frontend).

---

## 2. Catálogo de Constantes Globales

### 2.1 Roles del Sistema (`roles.ts`)
- **Archivo:** [`Shared/contracts/src/roles.ts`](../../Shared/contracts/src/roles.ts)
- Coinciden con los registros de la tabla `roles` en la base de datos:
  - `ROLES.SUPER_ADMIN` = `'super-admin'`
  - `ROLES.ADMIN_SUCURSAL` = `'admin-sucursal'`
  - `ROLES.CAJERO_VENDEDOR` = `'cajero-vendedor'`
- Tipo exportado: `Role`.

### 2.2 Permisos Granulares (`permissions.ts`)
- **Archivo:** [`Shared/contracts/src/permissions.ts`](../../Shared/contracts/src/permissions.ts)
- Coinciden con la columna `codigo` de la tabla `permisos` (`COLLATE utf8mb4_bin`):

| Contexto | Constante | Código en BD |
|---|---|---|
| **Autenticación** | `AUTH_MANAGE_USERS` | `'autenticacion:gestionar-usuarios'` |
| | `AUTH_ASSIGN_ROLES` | `'autenticacion:asignar-roles'` |
| | `AUTH_VIEW_AUDIT` | `'autenticacion:ver-auditoria'` |
| **Inventario** | `INVENTARIO_LEER` | `'inventario:leer'` |
| | `INVENTARIO_ESCRIBIR` | `'inventario:escribir'` |
| | `INVENTARIO_REGISTRAR_MOVIMIENTO` | `'inventario:registrar-movimiento'` |
| | `INVENTARIO_AJUSTAR_STOCK` | `'inventario:ajustar-stock'` |
| | `INVENTARIO_VER_KARDEX` | `'inventario:ver-kardex'` |
| **Facturación** | `FACTURACION_FACTURAR` | `'facturacion:facturar'` |
| | `FACTURACION_ANULAR` | `'facturacion:anular'` |
| | `FACTURACION_DEVOLUCION` | `'facturacion:devolucion'` |
| | `FACTURACION_CONSULTAR` | `'facturacion:consultar'` |
| | `FACTURACION_GESTIONAR_CLIENTES` | `'facturacion:gestionar-clientes'` |
| **Administración** | `ADMIN_GESTIONAR_SUCURSALES` | `'administracion:gestionar-sucursales'` |
| | `ADMIN_GESTIONAR_PERSONAL` | `'administracion:gestionar-personal'` |
| | `ADMIN_GESTIONAR_SALARIOS` | `'administracion:gestionar-salarios'` |
| | `ADMIN_VER_METRICAS_SUCURSAL` | `'administracion:ver-metricas-sucursal'` |
| | `ADMIN_VER_METRICAS_GLOBALES` | `'administracion:ver-metricas-globales'` |
| | `ADMIN_GESTIONAR_ALERTAS` | `'administracion:gestionar-alertas'` |
| **Logística** | `LOGISTICA_LEER` | `'logistica:leer'` |
| | `LOGISTICA_GESTIONAR_ACTIVOS` | `'logistica:gestionar-activos'` |
| | `LOGISTICA_ASIGNAR_ACTIVOS` | `'logistica:asignar-activos'` |
| | `LOGISTICA_MANTENIMIENTO` | `'logistica:mantenimiento'` |
| **MCP** | `MCP_CONSULTAR` | `'mcp:consultar'` |
| | `MCP_EJECUTAR_HERRAMIENTAS` | `'mcp:ejecutar-herramientas'` |
| | `MCP_HERRAMIENTAS_FINANCIERAS` | `'mcp:herramientas-financieras'` |

- Tipo exportado: `Permission`.

### 2.3 Catálogo de Herramientas MCP (`tool-names.ts`)
- **Archivo:** [`Shared/contracts/src/tool-names.ts`](../../Shared/contracts/src/tool-names.ts)
- Identificadores de tools MCP expuestas:
  - `TOOL_NAMES.CONSULTA_STOCK` = `'consulta-stock'`
  - `TOOL_NAMES.STOCK_BAJO` = `'stock-bajo'`
  - `TOOL_NAMES.VENTAS_PERIODO` = `'ventas-periodo'`
  - `TOOL_NAMES.ESTADO_FACTURA` = `'estado-factura'`
  - `TOOL_NAMES.METRICAS_GLOBALES` = `'metricas-globales'`
  - `TOOL_NAMES.CONSULTA_ACTIVO` = `'consulta-activo'`
- Tipo exportado: `ToolName`.

### 2.4 Catálogo de Auditoría (`auditoria.catalogo.ts`)
- **Archivo:** [`Shared/contracts/src/administracion/auditoria.catalogo.ts`](../../Shared/contracts/src/administracion/auditoria.catalogo.ts)
- Diccionarios `ACCIONES_AUDITORIA` (CREAR, EDITAR, ELIMINAR, CAMBIAR_ESTADO, etc.) y `ENTIDADES_AUDITORIA` (USUARIO, SUCURSAL, PRODUCTO, etc.) utilizados transversalmente por el sistema.

---

## 3. Esquemas de Validación Zod por Módulo

### 3.1 Paginación Común (`common/paginacion.schema.ts`)
- **Archivo:** [`Shared/contracts/src/common/paginacion.schema.ts`](../../Shared/contracts/src/common/paginacion.schema.ts)
- Esquema: `paginacionSchema`
  - `pagina`: Número entero positivo (`min(1)`, default: 1).
  - `limite`: Número entero entre 1 y 100 (`min(1).max(100)`, default: 20).
  - `ordenarPor`: String opcional.
  - `direccion`: Enum `'asc' | 'desc'` opcional (default: `'desc'`).
- Tipo: `PaginacionInput`.

### 3.2 Autenticación (`autenticacion/`)
- **Archivos:** [`login.schema.ts`](../../Shared/contracts/src/autenticacion/login.schema.ts) y [`renovar-token.schema.ts`](../../Shared/contracts/src/autenticacion/renovar-token.schema.ts).
- `loginSchema`: `email` (validación formato email) y `password` (string no vacío).
- `renovarTokenSchema`: `refreshToken` (string opcional si viene en cookie).

### 3.3 Inventario (`inventario/`)
- **Archivos:**
  - [`categoria.schema.ts`](../../Shared/contracts/src/inventario/categoria.schema.ts): `crearCategoriaSchema` (nombre requerido min 2, descripción opcional), `editarCategoriaSchema`.
  - [`proveedor.schema.ts`](../../Shared/contracts/src/inventario/proveedor.schema.ts): `crearProveedorSchema` (nombre, identificacionFiscal, telefono, email opcional), `editarProveedorSchema`.
  - [`producto.schema.ts`](../../Shared/contracts/src/inventario/producto.schema.ts): `crearProductoSchema` (sku min 3, nombre, categoriaId, proveedorId, precioVenta > 0, costoCompra >= 0, stockMinimo >= 0), `editarProductoSchema` (actualización de datos; excluye alteración de SKU).

### 3.4 Facturación (`facturacion/`)
- **Archivos:**
  - [`cliente.schema.ts`](../../Shared/contracts/src/facturacion/cliente.schema.ts): `registrarClienteSchema` (tipoCliente `'NATURAL' | 'JURIDICO'`, numeroIdentificacion, razonSocial, nombre, apellido, email, telefono), `buscarClientesSchema` (termino de búsqueda y paginación).
  - [`turno-caja.schema.ts`](../../Shared/contracts/src/facturacion/turno-caja.schema.ts): `abrirTurnoCajaSchema` (montoInicial >= 0).

### 3.5 Administración (`administracion/`)
- **Archivos:**
  - [`sucursal.schema.ts`](../../Shared/contracts/src/administracion/sucursal.schema.ts): `crearSucursalSchema` (nombre, codigo min 2 max 10, direccion, telefono), `editarSucursalSchema`.
  - [`usuario.schema.ts`](../../Shared/contracts/src/administracion/usuario.schema.ts): `crearUsuarioSchema` (email, nombre, rolId, sucursalId, password inicial), `cambiarRolUsuarioSchema`, `cambiarEstadoUsuarioSchema`, `restablecerPasswordUsuarioSchema`.
  - [`asignacion-sucursales.schema.ts`](../../Shared/contracts/src/administracion/asignacion-sucursales.schema.ts): `asignarSucursalesSchema` (array de IDs de sucursales a vincular al usuario).
  - [`auditoria.schema.ts`](../../Shared/contracts/src/administracion/auditoria.schema.ts): `consultarAuditoriaSchema` (filtros opcionales por usuarioId, modulo, accion, fechaInicio, fechaFin, paginación).

---

## 4. Estado de Módulos Pendientes

- **Logística:** [`Shared/contracts/src/logistica/.gitkeep`](../../Shared/contracts/src/logistica/.gitkeep) (**PENDIENTE**). Los contratos de creación, asignación y mantenimiento de activos se definirán cuando se implemente la capa de aplicación del módulo.
- **MCP:** [`Shared/contracts/src/mcp/.gitkeep`](../../Shared/contracts/src/mcp/.gitkeep) (**PENDIENTE**). Los esquemas de parámetros y respuestas para cada tool del MCP Server se ubicarán en este directorio.
