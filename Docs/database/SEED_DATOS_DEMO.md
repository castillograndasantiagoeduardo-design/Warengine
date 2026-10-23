# Documentación de Datos Demostrativos y Métricas de Base de Datos

> **Ubicación:** `Docs/database/SEED_DATOS_DEMO.md`  
> **Fecha:** Octubre 2026  
> **Módulo:** Panel de Super Administrador & Métricas de Negocio

---

## 1. Credenciales de Acceso Oficiales

Para acceder al sistema como **Super Administrador** (exclusivo para el panel de administración bajo `/admin/*`):

| Rol | Correo Electrónico | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **Super Admin (id=1)** | `superadmin@warengine.local` | `Warengine.Admin.2026!` | Acceso Total (30/30 permisos) |
| **Admin Sucursal (id=2)** | `admin.sucursal@warengine.local` | `AdminSucursal.2026!` | Administración de sucursal local |
| **Cajero (id=3)** | `cajero1@warengine.local` | `Cajero.2026!` | Turno de caja y facturación mostrador |
| **Vendedor B2B (id=4)** | `vendedor.b2b@warengine.local` | `VendedorB2B.2026!` | Clientes y pedidos B2B |

> [!IMPORTANT]
> Las rutas bajo `/admin/*` (`/admin/dashboard`, `/admin/sucursales`, `/admin/usuarios`, `/admin/inventario`, `/admin/auditoria`) están estrictamente protegidas a nivel de **Next.js Edge Middleware (`middleware.ts`)** y de guardián de cliente (`layout.tsx`). Cualquier usuario no autenticado o cuyo rol no sea `super-admin` (`rolId === 1`) es automáticamente redirigido a `/acceso?error=unauthorized_super_admin_only`.

---

## 2. Métricas Reales en Base de Datos MySQL

Los datos demostrativos fueron sembrados mediante `Backend/packages/database/src/seeds/demo-metricas.seed.ts` e insertados respetando estrictamente los triggers de integridad de MySQL (`trg_factura_items_check_stock`, `trg_factura_items_genera_salida`, `trg_movimientos_actualiza_stock`).

### 📊 Resumen Financiero Consolidado
* **Ingresos Totales (Ventas):** `COP $118.095.000`
* **Costo Total de Adquisición:** `COP $69.135.000`
* **Ganancia Neta Calculada:** `COP $48.960.000`
* **Margen de Rentabilidad Promedio:** `41.46%`
* **Total de Facturas Emitidas:** `16` (Distribuidas en Sede Principal, Sucursal Norte y Sucursal Sur)
* **Ticket Promedio:** `COP $7.380.937,50`

---

## 3. Sucursales y Áreas Sembradas

1. **Sede Principal (id=1):**
   * *Dirección:* Cra. 7 #72-10, Bogotá D.C.
   * *Teléfono:* +57 1 7440000
   * *Áreas:* Gerencia General, Almacén Central, Ventas & Facturación.
2. **Sucursal Norte (id=2):**
   * *Dirección:* Calle 10 #43E-12, Medellín, Antioquia
   * *Teléfono:* +57 4 4440001
   * *Áreas:* Almacén Norte, Ventas Norte.
3. **Sucursal Sur (id=3):**
   * *Dirección:* Av. Colombia #5-20, Cali, Valle del Cauca
   * *Teléfono:* +57 2 8880002
   * *Áreas:* Almacén Sur, Ventas Sur.

---

## 4. Catálogo de Productos y Precios Sembrados

| SKU | Nombre del Producto | Categoría | Precio Compra | Precio Venta | Margen Unitario |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PROD-SRV-001` | Servidor Rack 1U Xeon Silver | Redes & Servidores | $6.800.000 | $11.500.000 | +$4.700.000 (40.9%) |
| `PROD-SRV-002` | Switch Gestionable 48 Puertos PoE+ | Redes & Servidores | $2.400.000 | $4.200.000 | +$1.800.000 (42.9%) |
| `PROD-LAP-001` | Portátil ThinkPad T14 Gen 4 | Computadores & Laptops | $3.200.000 | $5.450.000 | +$2.250.000 (41.3%) |
| `PROD-LAP-002` | Workstation ThinkPad P16 | Computadores & Laptops | $6.100.000 | $9.800.000 | +$3.700.000 (37.8%) |
| `PROD-SSD-001` | SSD NVMe Enterprise 1.92TB | Almacenamiento & Memoria | $850.000 | $1.490.000 | +$640.000 (43.0%) |
| `PROD-SSD-002` | RAM DDR5 ECC 32GB Reg | Almacenamiento & Memoria | $420.000 | $780.000 | +$360.000 (46.2%) |
| `PROD-ACC-001` | Docking Station Thunderbolt 4 | Accesorios & Periféricos | $520.000 | $895.000 | +$375.000 (41.9%) |
| `PROD-LIC-001` | Windows Server Datacenter 16-Core | Software & Licencias | $4.500.000 | $7.200.000 | +$2.700.000 (37.5%) |

---

## 5. Comandos para Sembrar o Restaurar Datos

Desde la carpeta `Warengine/Backend/`:

```bash
# Sembrar datos de desarrollo completos (Super Admin, roles, sucursales, productos, facturas y métricas):
deno task seed:dev

# Limpiar datos de negocio conservando usuario Super Admin y catálogo base:
deno task seed:clean
```
