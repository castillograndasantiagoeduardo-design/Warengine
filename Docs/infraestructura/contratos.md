# Contratos Compartidos (`@warengine/contracts`)

Este documento describe la especificación del paquete `Shared/contracts`, la única fuente de verdad para los esquemas de validación Zod, tipos TypeScript y catálogos de constantes compartidos entre el backend y el frontend de Warengine.

---

## 1. Propósito y Reglas de Diseño

El paquete de contratos garantiza la coherencia de datos a lo largo de todo el ciclo de vida de una petición, desde la validación del formulario en el navegador hasta el controlador en el backend.

### Reglas de Aislamiento
- **Única dependencia:** Solo depende de la librería `zod`.
- **Cero lógica de negocio:** No implementa cálculo de totales, consultas de persistencia ni algoritmos de dominio.
- **Isomórfico y universal:** Puede ser importado por el backend (Deno) y por el frontend (Next.js / Node.js) sin modificaciones ni capas de emulación.

---

## 2. Catálogos Globales y Constantes

Ubicación: `Shared/contracts/src/`

### 2.1 Roles del Sistema (`roles.ts`)
Ubicación: [`Shared/contracts/src/roles.ts`](../../Shared/contracts/src/roles.ts)

```typescript
export const ROLES = {
  SUPER_ADMIN: 'super-admin',
  ADMIN_SUCURSAL: 'admin-sucursal',
  CAJERO_VENDEDOR: 'cajero-vendedor',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
```

Reflejan las filas fijas de la tabla `roles` en MySQL.

### 2.2 Permisos del Sistema (`permissions.ts`)
Ubicación: [`Shared/contracts/src/permissions.ts`](../../Shared/contracts/src/permissions.ts)

Define 22 códigos de permisos inmutables en notación `<modulo>:<accion>` que coinciden byte a byte con la columna binaria `codigo` (`utf8mb4_bin`) de la tabla `permisos`:

- **Autenticación:** `autenticacion:gestionar-usuarios`, `autenticacion:asignar-roles`, `autenticacion:ver-auditoria`.
- **Inventario:** `inventario:leer`, `inventario:escribir`, `inventario:registrar-movimiento`, `inventario:ajustar-stock`, `inventario:ver-kardex`.
- **Facturación:** `facturacion:facturar`, `facturacion:anular`, `facturacion:devolucion`, `facturacion:consultar`, `facturacion:gestionar-clientes`.
- **Administración:** `administracion:gestionar-sucursales`, `administracion:gestionar-personal`, `administracion:gestionar-salarios`, `administracion:ver-metricas-sucursal`, `administracion:ver-metricas-globales`, `administracion:gestionar-alertas`.
- **Logística:** `logistica:leer`, `logistica:gestionar-activos`, `logistica:asignar-activos`, `logistica:mantenimiento`.
- **MCP:** `mcp:consultar`, `mcp:ejecutar-herramientas`, `mcp:herramientas-financieras`.

### 2.3 Nombres de Tools MCP (`tool-names.ts`)
Ubicación: [`Shared/contracts/src/tool-names.ts`](../../Shared/contracts/src/tool-names.ts)

```typescript
export const TOOL_NAMES = {
  CONSULTA_STOCK: 'consulta-stock',
  STOCK_BAJO: 'stock-bajo',
  VENTAS_PERIODO: 'ventas-periodo',
  ESTADO_FACTURA: 'estado-factura',
  METRICAS_GLOBALES: 'metricas-globales',
  CONSULTA_ACTIVO: 'consulta-activo',
} as const;
```

### 2.4 Catálogo de Auditoría (`auditoria.catalogo.ts`)
Ubicación: [`Shared/contracts/src/administracion/auditoria.catalogo.ts`](../../Shared/contracts/src/administracion/auditoria.catalogo.ts)

- **Acciones Auditables (`ACCIONES_AUDITORIA`):** `crear`, `editar`, `activar`, `inactivar`, `cambiar_rol`, `acceso_denegado`, `restablecer_password`.
- **Entidades Auditables (`ENTIDADES_AUDITORIA`):** `sucursales`, `usuarios`, `categorias`, `proveedores`, `clientes`, `acceso`.

---

## 3. Esquemas Zod y Tipos Exportados (`src/index.ts`)

Todos los esquemas y tipos inferidos se exponen a través del punto de entrada [`Shared/contracts/src/index.ts`](../../Shared/contracts/src/index.ts):

| Módulo | Archivos de Contrato | Esquemas y Tipos Clave |
| :--- | :--- | :--- |
| **Autenticación** | `autenticacion/login.schema.ts`<br/>`autenticacion/renovar-token.schema.ts` | `loginSchema` (`LoginInput`), `renovarTokenSchema` (`RenovarTokenInput`). |
| **Administración** | `administracion/sucursal.schema.ts`<br/>`administracion/usuario.schema.ts`<br/>`administracion/auditoria.schema.ts` | `crearSucursalSchema`, `editarSucursalSchema`, `crearUsuarioSchema`, `cambiarRolUsuarioSchema`, `cambiarEstadoUsuarioSchema`, `restablecerPasswordUsuarioSchema`, `filtrosAuditoriaSchema`. |
| **Inventario** | `inventario/categoria.schema.ts`<br/>`inventario/proveedor.schema.ts` | `crearCategoriaSchema`, `editarCategoriaSchema`, `cambiarEstadoCategoriaSchema`, `crearProveedorSchema`, `editarProveedorSchema`, `cambiarEstadoProveedorSchema`. |
| **Facturación** | `facturacion/cliente.schema.ts` | `registrarClienteSchema` (`RegistrarClienteInput`), `buscarClienteQuerySchema` (`BuscarClienteQueryParams`). |

---

## 4. Consumo en Monorepo

```mermaid
flowchart LR
    CONTRACTS["@warengine/contracts<br/>(Zod Schemas & DTOs)"]
    API["Backend/apps/api<br/>(Controllers)"]
    CORE["Backend/packages/core<br/>(Use Cases Inputs)"]
    FRONT["Frontend/src/features<br/>(Forms & API Clients)"]

    API -->|Valida req.json()| CONTRACTS
    CORE -->|Tipa inputs| CONTRACTS
    FRONT -->|Valida react-hook-form<br/>Tipa fetch| CONTRACTS
```

- En `apps/api`: Los controladores ejecutan `schema.safeParse(body)` contra el payload recibido. Si falla, devuelven error 400 antes de tocar cualquier caso de uso.
- En `Frontend`: Se importa mediante el path mapping `@warengine/contracts` configurado en `tsconfig.json`.
