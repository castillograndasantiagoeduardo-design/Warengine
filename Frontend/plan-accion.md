# Plan de Acción Frontend — Presentación Proyecto WarEngine
**Fecha de Entrega / Exposición:** Lunes 26 de Octubre de 2026  
**Enfoque:** Frontend (Next.js 16 App Router · Clean Architecture · Principios SOLID)  
**Alcance:** Funcionalidades esenciales por rol/módulo para la demostración en vivo  

---

## 1. Visión General del Plan

El backend de WarEngine ya cuenta con la lógica de negocio, persistencia en base de datos y validaciones con contratos tipados. El objetivo de este plan de acción es implementar las **pantallas, flujos e interacciones críticas del Frontend** necesarias para realizar una demostración en vivo fluida, visualmente atractiva y robusta ante los evaluadores el día **lunes 26 de octubre**.

### Criterio de Selección de Funcionalidades (Demostración de Impacto)
Para una exposición académica o técnica de alto impacto, el tribunal evaluador busca ver:
1. **Seguridad y Control de Acceso:** Diferenciación clara entre roles con redirecciones y guardias perimetrales.
2. **Experiencia de Usuario (UX) Profesional:** Interfaces modernas, responsivas y con feedback instantáneo (estados de carga, confirmaciones y manejo de errores).
3. **Flujo de Negocio Completo (End-to-End):** Demostrar cómo una acción en el Punto de Venta (POS) impacta el inventario y las métricas del administrador en tiempo real.

---

## 2. Estado de Módulos para la Demo

| Módulo / Rol | Estado Actual | Prioridad para el 26 de Octubre | Esfuerzo Estimado |
| :--- | :--- | :--- | :--- |
| **Landing Page** | Completo y modularizado | Verificado | 0h |
| **Autenticación & Sesión** | Completo y conectado al Backend (2FA, Cookies, Middleware) | Verificado | 0h |
| **Punto de Venta (Cajero)** | Shell vacío en `/pos` | **ALTA (Prioridad 1)** | 4 - 5h |
| **Admin de Sucursal** | Shell vacío en `/dashboard` | **ALTA (Prioridad 2)** | 4 - 5h |
| **Superadministrador** | Shell vacío en `/dashboard` | **MEDIA-ALTA (Prioridad 3)** | 3 - 4h |
| **Vendedor B2B** | No implementado | **PENDIENTE (Fuera de alcance)** | Postergado |

---

## 3. Especificación de Funcionalidades Básicas por Módulo

### Módulo 1: Autenticación y Control de Acceso (COMPLETADO)
* **Funcionalidades ya disponibles para la demo:**
  * Login reactivo con validación de credenciales en tiempo real (`useLoginForm`).
  * Desafío de Segundo Factor de Autenticación (2FA - TOTP de 6 dígitos) vía `TwoFactorStep`.
  * Protección contra ataques de fuerza bruta (bloqueo temporal con timer en HTTP 429).
  * Redirección inteligente post-login según el rol del usuario autenticado:
    * `super-admin` → `/dashboard` (vista global de la plataforma).
    * `admin-sucursal` → `/dashboard` (vista contextual de su sucursal asignada).
    * `cajero` → `/pos` (terminal interactiva de venta).
  * Persistencia segura mediante cookies `HttpOnly` y renovación silenciosa de tokens (`apiClient`).
  * Botón de Cierre de Sesión seguro que invalida la sesión en backend y redirige a la landing page.

---

### Módulo 2: Cajero — Punto de Venta (`cajero` en `/pos`)
El módulo de caja es la pieza central que demuestra la operatividad del negocio.

* **Ruta Frontend:** `src/app/(punto-de-venta)/pos/page.tsx`
* **Feature:** `src/features/pos/`
* **Funcionalidades Básicas Indispensables:**
  1. **Control de Turno de Caja (Apertura y Estado):**
     * Verificación automática al cargar: si el cajero no tiene un turno abierto hoy, se despliega un modal bloqueante de **Apertura de Turno** solicitando el monto base inicial (ej. `$50.000 COP`).
     * Header del POS con indicador visual: nombre del cajero, número de sucursal, hora y badge verde de `Turno Abierto`.
  2. **Catálogo de Productos para Venta Rápida:**
     * Buscador en tiempo real por nombre o código de barras.
     * Cuadrícula de tarjetas de productos con imagen, nombre, precio unitario y badge de stock disponible.
     * Alerta visual cuando un producto tiene stock cero (deshabilitado para agregar).
  3. **Carrito de Compra Dinámico:**
     * Panel lateral derecho con el detalle de los productos agregados.
     * Incremento/decremento de cantidades y botón para remover ítem.
     * Desglose numérico automático: Subtotal, Impuestos (IVA) y Total a pagar.
  4. **Pasarela de Cobro y Registro de Venta:**
     * Botón prominente de `Cobrar / Facturar (F12)`.
     * Modal de cobro con selección de método de pago:
       * **Efectivo:** Campo para ingresar monto recibido con cálculo automático del cambio/vuelto.
       * **Transferencia / Nequi / Tarjeta:** Confirmación directa de transacción.
     * Datos del cliente: Opción rápida de "Cliente General / Consumidor Final" o formulario mínimo (Identificación y Nombre).
     * Petición tipada al backend (`POST /facturacion/facturas`) y reseteo inmediato del carrito.
  5. **Comprobante de Venta (Ticket Modal):**
     * Modal con formato tipo recibo térmico con resumen de los ítems, fecha, número de factura y botón de "Imprimir / Nueva Venta".
  6. **Cierre de Turno de Caja:**
     * Botón accesible en el menú del POS para solicitar arqueo y cierre de turno al finalizar la jornada.

---

### Módulo 3: Administrador de Sucursal (`admin-sucursal` en `/admin-sucursal`)
Demuestra el control operativo y la visibilidad de inventario dentro de una sede específica.
Aislamiento estricto: Todo el código de frontend de este rol reside en `features/admin-sucursal/` y la ruta `/admin-sucursal`, garantizando cero colisiones con el compañero que desarrolla `superadmin`. (Seguridad: 2FA TOTP es exclusivo para superadmin; no aplica a admin de sucursal).

* **Ruta Frontend:** `src/app/(panel)/admin-sucursal/page.tsx`
* **Feature:** `src/features/admin-sucursal/`
* **Funcionalidades Básicas Indispensables:**
  1. **Dashboard Resumen de Sucursal:**
     * Tarjetas de indicadores rápidos (KPIs) en diseño vertical/alargado:
       * Ventas del día en la sucursal ($) con comparativa de jornada previa.
       * Transacciones con ticket promedio en tiempo real.
       * Productos en catálogo con alertas de stock bajo y agotado.
       * Cajeros activos en línea y turnos de caja en curso.
     * Gráfico esbelto de velocidad de ventas horaria (curva Bezier SVG con altura ampliada) y barra de meta diaria.
  2. **Gestión de Catálogo e Inventario de Sede:**
     * Monitoreo de salud de stock por categorías.
     * **Modal de Registro de Producto:** Formulario validado con Zod (`@warengine/contracts`) para registrar un nuevo producto o ajustar el stock de sede.
  3. **Personal y Turnos de la Sucursal:**
     * Vista de cajeros asignados a la sede y estado de turno de caja en tiempo real.
     * Operaciones recientes con folios y método de pago.

---

### Módulo 4: Superadministrador (`super-admin` en `/dashboard`)
Demuestra el control multi-tenant y la administración global de la plataforma WarEngine.

* **Ruta Frontend:** `src/app/(panel)/dashboard/page.tsx`
* **Feature:** `src/features/administracion/`
* **Funcionalidades Básicas Indispensables:**
  1. **Métricas Globales de la Plataforma:**
     * Tarjetas de resumen general:
       * Total de sucursales registradas y operativas.
       * Total de usuarios activos en el sistema.
       * Ventas consolidadas globales.
  2. **Gestión de Sucursales:**
     * Tabla de sucursales con: Nombre, Dirección, Teléfono, Encargado y Estado.
     * **Modal de Creación de Sucursal:** Formulario simple para dar de alta una nueva sede (ej. "Sede Norte", "Sede Centro").
  3. **Gestión de Usuarios y Roles:**
     * Listado general de usuarios de la organización.
     * Asignación de roles (`super-admin`, `admin-sucursal`, `cajero`).
     * Asignación de la sucursal a la que pertenece cada usuario.
  4. **Log de Auditoría Básica:**
     * Tabla de solo lectura que liste los últimos eventos críticos del sistema (ej. logins, aperturas de caja, creación de productos) aprovechando el catálogo de auditoría del backend.

---

### Módulo 5: Vendedor B2B (`vendedor-b2b`) — (POSTERGADO)
* **Motivo:** No es un requisito crítico para el flujo principal de venta retail y gestión de sucursal.
* **Acción:** No se incluirá en el menú de navegación de la demo. Si un usuario con este rol ingresa, el middleware o la interfaz mostrará un aviso de *"Módulo en fase de activación para ventas mayoristas"*.

---

## 4. Cronograma de Ejecución para el Fin de Semana

### Domingo 25 de Octubre — Bloque Mañana (08:00 - 13:00)
* **Objetivo:** Construir el Layout administrativo unificado y el flujo del Punto de Venta (POS).
* **Tareas:**
  1. Diseñar el **Shell / Layout del Dashboard** (`Sidebar`, `Header` con perfil de usuario y botón de `Cerrar Sesión`).
  2. Crear componentes del feature POS en `src/features/pos/`:
     * `AperturaTurnoModal.tsx`
     * `ProductGrid.tsx` y `ProductCard.tsx`
     * `CartPanel.tsx`
     * `PaymentModal.tsx` y `TicketModal.tsx`
  3. Conectar el POS con los endpoints del backend (`GET /inventario/productos`, `POST /facturacion/facturas`, `POST /facturacion/turnos-caja/abrir`).

### Domingo 25 de Octubre — Bloque Tarde (14:00 - 19:00)
* **Objetivo:** Construir el módulo de Inventario y Sucursal para `admin-sucursal`.
* **Tareas:**
  1. Crear componentes de inventario en `src/features/inventario/`:
     * `ProductTable.tsx` con búsqueda y paginación básica.
     * `CreateProductModal.tsx` con validación Zod.
  2. Conectar la vista de Dashboard de Sucursal con las métricas del día (`GET /administracion/dashboard/sucursal`).
  3. Probar la reactividad: realizar una venta en el POS y verificar que el stock en la tabla de inventario disminuya de inmediato.

### Domingo 25 de Octubre — Bloque Noche (20:00 - 23:00)
* **Objetivo:** Vistas de Superadmin y pulido visual.
* **Tareas:**
  1. Crear la vista de Sucursales y Usuarios para `super-admin` en `src/features/administracion/`.
  2. Tarjetas de métricas consolidadas (`GET /administracion/dashboard/global`).
  3. Asegurar consistencia visual (estilo oscuro neumórfico/gold de WarEngine).

### Lunes 26 de Octubre — Bloque Mañana (Previo a la Exposición)
* **Objetivo:** Validación, datos semilla y ensayo del guion de presentación.
* **Tareas:**
  1. Ejecutar seeds en base de datos para contar con usuarios de prueba listos:
     * `superadmin@warengine.com` (Superadmin)
     * `admin.norte@warengine.com` (Admin Sucursal)
     * `cajero1@warengine.com` (Cajero)
  2. Verificar que haya productos con imágenes y precios realistas ya cargados.
  3. Ensayar el guion de la demostración de 10 a 15 minutos.

---

## 5. Guion Recomendado para la Exposición (Happy Path)

Para mantener a la audiencia atenta y mostrar la potencia del sistema, se recomienda seguir este orden exacto:

1. **Introducción & Propuesta de Valor (2 min):**
   * Mostrar la **Landing Page**: explicar la propuesta de WarEngine (gestión multi-sucursal y POS en tiempo real).
   * Navegar entre secciones (Alcance con el robot 3D y planes de suscripción).
2. **Acceso Seguro (1.5 min):**
   * Ingresar a `/acceso`.
   * Demostrar el inicio de sesión con validación de credenciales, protección contra fuerza bruta y el paso de verificación 2FA (TOTP de 6 dígitos).
3. **Rol 1 — Superadministrador (2.5 min):**
   * Iniciar sesión como `super-admin`.
   * Mostrar el Dashboard Global con métricas multi-sucursal.
   * Mostrar la tabla de sucursales activas y cómo se gestionan las sedes y usuarios.
4. **Rol 2 — Administrador de Sucursal (2.5 min):**
   * Iniciar sesión como `admin-sucursal`.
   * Mostrar el inventario de la sucursal, filtrando productos y destacando las alertas de stock bajo.
   * Abrir el modal de creación de un nuevo producto para la demo.
5. **Rol 3 — Cajero & Punto de Venta en Vivo (4 min):**
   * Iniciar sesión como `cajero` (redirección automática a `/pos`).
   * Abrir turno con base inicial.
   * Realizar una venta en vivo: buscar productos, agregarlos al carrito, aplicar cobro en efectivo y emitir el ticket.
   * Volver al perfil de administrador para evidenciar que el stock del producto vendido se redujo automáticamente y la venta sumó a las métricas del día.
6. **Conclusión Técnica (1.5 min):**
   * Destacar la arquitectura modular (SOLID, contratos compartidos vía Zod, Edge Middleware y sesión segura en cookies HttpOnly sin fugas en `localStorage`).

---

## 6. Pautas de Código y Recordatorio Arquitectónico
* Toda petición debe usar `apiClient` (`import { apiClient } from '@/lib/api'`).
* Prohibido almacenar tokens en `localStorage`.
* Reutilizar contratos y esquemas Zod desde `@warengine/contracts`.
* Mantener los componentes visuales bajo 200 líneas de código, delegando la lógica a custom hooks (`usePos`, `useInventario`).
