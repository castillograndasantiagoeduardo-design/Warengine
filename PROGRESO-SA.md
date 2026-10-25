# PROGRESO-SA.md — Seguimiento de Implementación Panel Super Admin Warengine

> **Archivo de Control y Progreso Continuo**  
> Fecha límite / Demo: Lunes 26 de Octubre de 2026  
> Responsable: Asistente IA (Antigravity) & Dev Lead

---

## Estado Global de Fases

| Fase | Descripción | Estado | Commit |
| :--- | :--- | :--- | :--- |
| **FASE 0** | Análisis, mapa botón → endpoint → Zod, discrepancias y riesgos | **COMPLETADO** | `docs(sa): analisis preliminar y mapa de arquitectura super admin (fase 0)` |
| **FASE 1** | Backend (huecos de la API: roles, dashboard resumen, permisos globales, usuarios/empleados, auditoría, seed demo) | **EN CURSO** | Pendiente |
| **FASE 2** | Esqueleto Frontend (Shell, Layout, UI Kit, Lib, Selector por Rol) | **PENDIENTE** | Pendiente |
| **FASE 3** | Pantallas P0 (Dashboard Global, Sucursales + Áreas, Usuarios y Roles, Auditoría) | **PENDIENTE** | Pendiente |
| **FASE 4** | Pantallas P1 (Empleados + Salarios, Alertas Admin y Stock, Cuenta 2FA) | **PENDIENTE** | Pendiente |
| **FASE 5** | Pantallas P2 (Inventario Global, Facturación Admin, Logística, Drawer Asistente IA) | **PENDIENTE** | Pendiente |

---

## FASE 0 — Análisis Integral de Arquitectura y Discrepancias

### 1. Qué Existe y Qué Reutilizaremos

#### Backend (Deno 2 + Hono + Drizzle ORM + Clean Architecture)
* **Arquitectura de Capas Respetada:**
  - `packages/shared-kernel`: Mónada `Result<T, DomainError>`, clases base `Entity`, `ValueObject`.
  - `packages/core`: Casos de uso e interfaces de repositorio sin dependencias de infraestructura.
  - `packages/database`: Esquemas Drizzle MySQL (InnoDB), repositorios concretos y migraciones.
  - `packages/platform`: Hashing Argon2id, tokens JWT HS256, TOTP, Mailer y Gemini Service.
  - `packages/composition`: Inyección pura de dependencias en `createContainer()`.
  - `apps/api`: Rutas Hono, controladores, middlewares (`authMiddleware`), traductor `presentResult`.
* **Endpoints existentes en `/administracion`:**
  - Sucursales (`/sucursales`, `/sucursales/:id/detalle`, `/sucursales/:id/estado`, `/sucursales/:id/areas`, `/areas/:id`).
  - Empleados (`/empleados`, `/empleados/:id`, `/empleados/:id/salarios`).
  - Usuarios (`/usuarios`, `/usuarios/:id/rol`, `/usuarios/:id/estado`, `/usuarios/:id/password`, `/usuarios/:id/sucursales`).
  - Auditoría (`/auditoria`, `/auditoria/exportar`).
  - Alertas (`/alertas`, `/alertas-stock`, `/alertas/:id/estado`).
  - Dashboard analítico (`/dashboard/metricas`, `/dashboard/tendencias`, `/dashboard/rendimiento`, `/dashboard/ranking`, `/dashboard/inventario`).
* **Suite de Pruebas:** 367 tests unitarios pasando al 100% (`deno task test`).

#### Frontend (Next.js 16 + React 19 + Tailwind CSS v4)
* **Reutilización directa:**
  - Cliente HTTP: `apiClient` (`Frontend/src/lib/api/http-client.ts`) con manejo transparente de cookies HttpOnly (`access_token`, `refresh_token`) y reintento con *silent refresh* ante HTTP 401.
  - Autenticación: `AuthProvider`, `useAuth`, `usePermissions` (`Frontend/src/features/autenticacion/`).
  - Componentes UI base: `Button3D`, `Badge`, `Spinner`, `Skeleton`, `EmptyState`, `Navbar`, `NoiseOverlay`.
  - Tokens visuales: Paleta de color WarEngine (Navy `#0d1630`, Gold `#e3b341`, Gold Dark `#b88a1f`, Dark Planes `#202022`), tipografías corporativas (`Anton`, `Archivo`, `Pixelify Sans`).
  - Contratos Zod compartidos: `@warengine/contracts`.
  - Middleware perimetral Edge: `Frontend/src/middleware.ts` protegiendo `/dashboard` y subrutas.

---

### 2. Mapa Botón por Botón del Super Admin → Endpoint Real → Esquema Zod

| Vista / Pantalla | Botón / Acción de Usuario | Endpoint HTTP Real | Permiso Backend Requerido | Contrato / Esquema Zod |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard Global** | Carga inicial / Refrescar KPIs | `GET /administracion/dashboard/resumen` *(a crear)* | `administracion:ver-metricas-globales` | `resumenDashboardSchema` |
| **Dashboard Global** | Métricas financieras consolidadas | `GET /administracion/dashboard/metricas` | `administracion:ver-metricas-globales` | `metricasGananciasQuerySchema` |
| **Dashboard Global** | Selector temporal (Día/Sem/Mes) | `GET /administracion/dashboard/tendencias?agrupacion=...` | `administracion:ver-metricas-globales` | `tendenciasVentasQuerySchema` |
| **Dashboard Global** | Rendimiento comparativo sedes | `GET /administracion/dashboard/rendimiento` | `administracion:ver-metricas-globales` | `rendimientoSucursalesQuerySchema` |
| **Dashboard Global** | Ranking más/menos vendidos | `GET /administracion/dashboard/ranking?orden=desc` | `administracion:ver-metricas-globales` | `rankingProductosQuerySchema` |
| **Dashboard Global** | Comparativo stock crítico | `GET /administracion/dashboard/inventario` | `administracion:ver-metricas-globales` | `comparativoInventarioQuerySchema` |
| **Sucursales** | Listar sedes | `GET /administracion/sucursales` | `administracion:gestionar-sucursales` | Sin query obligatoria |
| **Sucursales** | Modal "Nueva Sucursal" → Guardar | `POST /administracion/sucursales` | `administracion:gestionar-sucursales` | `crearSucursalSchema` |
| **Sucursales** | Modal "Editar Sucursal" → Guardar | `PUT /administracion/sucursales/:id` | `administracion:gestionar-sucursales` | `editarSucursalSchema` |
| **Sucursales** | Toggle "Activar/Inactivar Sede" | `PUT /administracion/sucursales/:id/estado` | `administracion:gestionar-sucursales` | `cambiarEstadoSucursalSchema` |
| **Sucursales** | "Ver Ficha de Detalle" | `GET /administracion/sucursales/:id/detalle` | `administracion:gestionar-sucursales` | Param `:id` numérico |
| **Sucursales / Áreas**| Listar áreas de sucursal | `GET /administracion/sucursales/:id/areas` | `administracion:gestionar-sucursales` | Param `:id` numérico |
| **Sucursales / Áreas**| Modal "Nueva Área" → Guardar | `POST /administracion/sucursales/:id/areas` | `administracion:gestionar-sucursales` | `crearAreaSchema` |
| **Sucursales / Áreas**| Modal "Editar Área" → Guardar | `PUT /administracion/areas/:id` | `administracion:gestionar-sucursales` | `editarAreaSchema` |
| **Sucursales / Áreas**| Botón "Eliminar Área" (con confirmación)| `DELETE /administracion/areas/:id` | `administracion:gestionar-sucursales` | Param `:id` numérico |
| **Usuarios y Roles** | Listar con filtros y paginación | `GET /administracion/usuarios` | `autenticacion:gestionar-usuarios` | `filtrosUsuariosSchema` |
| **Usuarios y Roles** | Cargar catálogo de roles | `GET /administracion/roles` *(a crear)* | `autenticacion:asignar-roles` | Sin query |
| **Usuarios y Roles** | Modal "Nuevo Usuario" (Atómico) | `POST /administracion/usuarios` | `autenticacion:gestionar-usuarios` | `crearUsuarioSchema` |
| **Usuarios y Roles** | Modal "Cambiar Rol" → Confirmar | `PUT /administracion/usuarios/:id/rol` | `autenticacion:asignar-roles` | `cambiarRolSchema` |
| **Usuarios y Roles** | Modal "Asignar Sucursales" | `PUT /administracion/usuarios/:id/sucursales` | `autenticacion:gestionar-usuarios` | `asignarSucursalesSchema` |
| **Usuarios y Roles** | Toggle "Activar / Suspender" | `PUT /administracion/usuarios/:id/estado` | `autenticacion:gestionar-usuarios` | `cambiarEstadoSchema` |
| **Usuarios y Roles** | Modal "Restablecer Contraseña" | `PUT /administracion/usuarios/:id/password` | `autenticacion:gestionar-usuarios` | `restablecerPasswordSchema` |
| **Auditoría** | Filtrar tabla por fecha/actor/acción | `GET /administracion/auditoria` | `autenticacion:ver-auditoria` | `consultarAuditoriaSchema` |
| **Auditoría** | "Ver Detalle Antes/Después" | Visualización de diff JSON en modal | `autenticacion:ver-auditoria` | En payload devuelto |
| **Auditoría** | Botón "Exportar CSV" | `GET /administracion/auditoria/exportar?formato=csv` | `autenticacion:ver-auditoria` | `exportarAuditoriaCsvSchema` |
| **Empleados** | Listar colaboradores con filtro | `GET /administracion/empleados` | `administracion:gestionar-personal` | `listarEmpleadosQuerySchema` |
| **Empleados** | "Ver Detalle Empleado" | `GET /administracion/empleados/:id` | `administracion:gestionar-personal` | Param `:id` UUID |
| **Empleados** | Modal "Editar Empleado" | `PUT /administracion/empleados/:id` | `administracion:gestionar-personal` | `editarEmpleadoSchema` |
| **Empleados** | "Historial Salarial" | `GET /administracion/empleados/:id/salarios` | `administracion:gestionar-salarios` | Param `:id` UUID |
| **Empleados** | Modal "Registrar Aumento Salarial" | `POST /administracion/empleados/:id/salarios` | `administracion:gestionar-salarios` | `registrarAumentoSalarioSchema` |
| **Alertas Admin** | Listar alertas administrativas | `GET /administracion/alertas` | `administracion:gestionar-alertas` | `listarAlertasAdminQuerySchema` |
| **Alertas Admin** | Listar alertas de stock crítico | `GET /administracion/alertas-stock` | `administracion:gestionar-alertas` | `consultarAlertasStockQuerySchema` |
| **Alertas Admin** | Cambiar estado (Pendiente/Visto/Atendido)| `PUT /administracion/alertas/:id/estado` | `administracion:gestionar-alertas` | `cambiarEstadoAlertaAdminSchema` |
| **Cuenta SuperAdmin** | "Configurar 2FA" (QR + secreto) | `POST /auth/2fa/configurar` | Requiere sesión activa | Sin body |
| **Cuenta SuperAdmin** | Modal "Activar 2FA" (código 6 dígitos) | `POST /auth/2fa/activar` | Requiere sesión activa | `activar2faSchema` |
| **Cuenta SuperAdmin** | "Desactivar 2FA" (con clave) | `POST /auth/2fa/desactivar` | Requiere sesión activa | `desactivar2faSchema` |
| **Asistente IA** | Enviar mensaje en Drawer | `POST /asistente/chat` | `mcp:consultar` | `conversacionChatSchema` |

---

### 3. Discrepancias entre el Plan y el Código Real

1. **Rutas inexistentes en el plan vs código:**
   - En `plan-accion.md` se citan `GET /administracion/dashboard/global` y `GET /administracion/dashboard/sucursal`. **No existen**. El backend expone endpoints atómicos: `/dashboard/metricas`, `/dashboard/tendencias`, `/dashboard/rendimiento`, `/dashboard/ranking`, `/dashboard/inventario`.
   - Se creará `GET /administracion/dashboard/resumen` para unificar los KPIs de cabecera que hoy no están en un solo endpoint (total sucursales operativas, usuarios activos, ventas consolidadas).
2. **Catálogo de Roles faltante en la API:**
   - La tabla `roles` existe en base de datos y en seed, pero no existía ningún endpoint `GET /administracion/roles`. El frontend necesita este catálogo para los modales de creación y cambio de rol.
3. **Paginación y Enriquecimiento de Usuarios:**
   - El caso de uso actual `ListarUsuariosUseCase` retorna una lista no paginada `UsuarioGestionado[]` sin la lista de sucursales adicionales ni soporte de páginas (`pagina`, `limite`). Se extenderá respetando Clean Architecture.
4. **Permisos en rutas de métricas globales:**
   - `administracion.routes.ts` usaba `PERMISO_METRICAS = 'administracion:ver-metricas-sucursal'` para todos los dashboards. Para proteger las métricas globales consolidadas (RF-ADM-A1, RF-SA-I3), las rutas consolidadas transversales deben exigir `administracion:ver-metricas-globales`, que solo posee el Super Admin.
5. **Ubicación de rutas en Frontend:**
   - En una rama remota preliminar se intentó crear rutas en `src/app/(panel)/admin/*`. Sin embargo, la especificación obligatoria dicta que `/dashboard` es la raíz compartida y las subrutas del Super Admin deben ubicarse bajo `src/app/(panel)/dashboard/*` (ej: `/dashboard/sucursales`, `/dashboard/usuarios`, `/dashboard/auditoria`, `/dashboard/empleados`, `/dashboard/alertas`), asegurando compatibilidad con el Edge Middleware.

---

### 4. Matriz de Riesgos y Mitigaciones

| Riesgo | Severidad | Impacto | Mitigación |
| :--- | :--- | :--- | :--- |
| **Colisión de trabajo en `/dashboard` con admin-sucursal y POS** | ALTA | Bloqueo o sobreescritura del compañero | `/dashboard/page.tsx` será estrictamente un selector por rol: si el rol es `super-admin`, renderiza la vista global; si es `admin-sucursal`, renderiza un punto de montaje limpio y desacoplado. Cero modificaciones en `src/features/pos/` ni `src/features/inventario/`. |
| **Incompatibilidades Next.js 16 (React 19)** | MEDIA | Fallas en librerías de componentes UI | No usar librerías de UI complejas de terceros. Construir componentes nativos accesibles bajo Tailwind v4 y React 19 siguiendo la skill `warengine-ui`. |
| **Rotura de Clean Architecture en Deno** | CRÍTICA | Rechazo automático de arquitectura | `core` jamás importará drizzle ni librerías SQL; todo error de negocio retornará `Result.err(DomainError)`; DTOs validados con Zod en frontera antes del caso de uso. |
| **Inconsistencia de datos durante la Demo** | ALTA | Demostración fallida ante evaluadores | Script de seed idempotente `seed:demo` con datos realistas completos (3 sucursales, usuarios con credenciales de entorno, productos con stock bajo, historial de ventas y auditoría). |

---

## Detalle de Tareas en Curso — FASE 1 (Backend)

- [ ] **Paso 1.1:** Crear `ListarRolesUseCase`, repositorio de lectura de roles, controlador y ruta `GET /administracion/roles` con permiso `autenticacion:asignar-roles`.
- [ ] **Paso 1.2:** Implementar `GET /administracion/dashboard/resumen` protegido con `administracion:ver-metricas-globales` con total de sucursales operativas, usuarios activos y ventas consolidadas.
- [ ] **Paso 1.3:** Ajustar permisos en rutas de dashboard globales para exigir `administracion:ver-metricas-globales`.
- [ ] **Paso 1.4:** Enriquecer listado de usuarios con paginación (`pagina`, `limite`), sucursales asignadas y filtros combinables; verificar filtro de sucursal en empleados.
- [ ] **Paso 1.5:** Verificar y completar filtros de auditoría y exportación CSV con detalle antes/después sanitizado.
- [ ] **Paso 1.6:** Implementar seed idempotente `seed:demo` (`deno task seed:demo`) con 3 sucursales, empleados, usuarios y ventas históricas.
- [ ] **Paso 1.7:** Actualizar contratos Zod, OpenAPI, pruebas unitarias (`deno task test`) y verificación de tipos (`deno task check` y `lint`).
