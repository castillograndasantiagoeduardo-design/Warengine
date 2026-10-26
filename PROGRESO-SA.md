# PROGRESO-SA.md — Panel del Super Admin (Warengine)

> Demo: lunes 26 de octubre de 2026 · Rama: `feat/sa-base` (sin push)
> Última actualización: domingo 25/10/2026 — Fases A, B y C terminadas y probadas en vivo; Fase D no iniciada.

## Estado por fase

| Fase | Alcance | Estado |
| :--- | :--- | :--- |
| Base (12 commits previos) | Kit UI, shell, selector `/dashboard`, dashboard global, sucursales + detalle + áreas, empleados + salarios | ✅ Hecho |
| **A — Backend** | roles, resumen, permisos globales, usuarios paginados, auditoría, seed demo, docs | ✅ Hecho y probado en vivo |
| **B — P0** | Autorización por permisos en la UI, Usuarios y roles, Auditoría | ✅ Hecho (API probada en vivo; UI sin revisión visual) |
| **C — P1** | Alertas administrativas y de stock, Cuenta 2FA | ✅ Hecho (API probada en vivo; UI sin revisión visual) |
| **D — P2** | Inventario global, facturación admin, logística, asistente | ⏳ Solo si queda tiempo |

## Fase A — Backend

| Paso | Resultado | Commit |
| :--- | :--- | :--- |
| A1 `GET /administracion/roles` | Puerto `IRolCatalogoRepository`, `ListarRolesUseCase`, permiso `autenticacion:asignar-roles` | `df384d5` |
| A2 `GET /administracion/dashboard/resumen` | Sucursales operativas, usuarios activos, ventas consolidadas; permiso `ver-metricas-globales` | `a76802b` |
| A3 Permisos de métricas | `metricas`, `rendimiento`, `ranking`, `inventario` → `ver-metricas-globales`; `tendencias` sigue con `ver-metricas-sucursal` | `791893e` |
| A4 `GET /administracion/usuarios` | `pagina`/`limite`, filtros rol + sucursal + estado + texto, `sucursalesAdicionales`; frontend adaptado | `8c3724b` |
| A5 Auditoría | Ya cumplía (filtros fecha/actor/acción/entidad, `antes/despues` sanitizado al escribir, CSV/JSON). Sin cambios | — |
| A6 `deno task seed:demo` | Idempotente, pasa por los triggers reales; contraseña solo desde `SEED_DEMO_PASSWORD` | `3989d85` |
| A7 Documentación | `Docs/infraestructura/api.md` §6 (contrato real), `Docs/modulos/administracion.md` corregido; 34/34 rutas en OpenAPI y `Http/` | `b3ddd3f` |

Verificación tras cada paso: `deno task check` ✅ · `lint` sin problemas nuevos (235 preexistentes) ✅ · `deno task test` 381/381 ✅.

## Fase B — Pantallas P0

| Paso | Resultado | Commit |
| :--- | :--- | :--- |
| B0 Autorización por permisos | Sin atajo super-admin; `permisos.ts` (acción → permiso de la ruta); bloques y botones según permiso; 403 → acceso restringido | `20fc4e3` |
| B1 Usuarios y roles | Paginado en servidor, filtros, alta atómica, rol (último super-admin), multisede, estado, contraseña | `aeec118` |
| B2 Auditoría | Filtros fecha/actor/acción/entidad, detalle antes/después, exportar CSV | `3adc216` |

`npm run build` ✅ tras cada paso. Sin probar contra la API real (ver Dudas 1).

## Fase C — Pantallas P1

| Paso | Resultado | Commit |
| :--- | :--- | :--- |
| C3 Alertas | Administrativas (filtro estado/sucursal, urgentes primero, marcar vista/atender) + stock bajo paginado | `3d978b9` |
| C4 Mi cuenta | 2FA: QR + secreto, activar con código de 6 dígitos, desactivar con contraseña. Dependencia nueva `qrcode-generator@2.0.4` (MIT) | `17991fc` |

## Prueba en vivo (25/10/2026, API y BD reales)

- `seed:demo` ejecutado: 3 sedes, 6 áreas, 11 empleados, 5 usuarios, 20 productos, 151 facturas en 21 días, 3 alertas. Segunda ejecución sin duplicados (idempotente). Integridad: 0 turnos abiertos o descuadrados, 0 stock negativo, pagos = totales, sueldos sincronizados, 5 productos bajo mínimo.
- **API: 67/67 pruebas** (script con login real, sin imprimir secretos): dashboard (resumen, métricas, tendencias día/semana, rendimiento, ranking), sucursales (editar/revertir, reglas de sede principal y usuarios activos, duplicado), áreas (crear/renombrar/eliminar, área con empleados), empleados y salarios, usuarios (paginación, filtros, búsqueda, último super-admin, rol, estado, contraseña, multisede, correo duplicado), alertas, auditoría (antes/después, filtros fecha/actor, CSV sin contraseñas), 403 por permiso con `admin.norte`, y 2FA completo (configurar → código TOTP → login 428 → verificar → desactivar).
- **Flujo de navegador: 14/14**: CORS desde `localhost:3000`, cookies HttpOnly, API autenticada solo con cookie, middleware redirige sin sesión, y las 8 páginas del panel responden 200.
- Mutaciones irreversibles (crear sucursal/usuario, registrar salario, cambiar estado de alertas) se probaron solo por sus rutas de error para no ensuciar la demo.
- **Bugs encontrados y corregidos:** CSV salía como `text/plain` (`3aec13c`); empleados no respetaban el alcance por sede: un admin de sucursal veía empleados y sueldos de todas las sedes (`afcb632`).
- **No verificado:** la apariencia y la interacción de las pantallas (no hay navegador automatizable en la sesión).

## Dudas y riesgos abiertos

1. **Variables en el `.env` de la raíz:** `WARENGINE_SA_PASSWORD` y `SEED_DEMO_PASSWORD` están en `Warengine/.env`, que ninguna tarea carga. Para repetir el seed: `deno run -A --env-file=.env --env-file=../.env packages/database/src/seeds/demo.seed.ts` desde `Backend/` (o moverlas a `Backend/.env` y usar `deno task seed:demo`).
2. **Impacto en la vista del admin de sucursal (A3):** el admin de sucursal ya no puede pedir `/dashboard/metricas`, `/rendimiento`, `/ranking` ni `/inventario` (403). Su vista debe usar `/dashboard/tendencias` u otras fuentes. Avisar a quien construye esa vista.
3. **GEMINI.md** pide `Result.err(...)`; la API real de `Result` es `Result.fail(...)`. Se usa `fail`.
4. **Códigos 400 vs 422:** `SEDE_PRINCIPAL_NO_INACTIVABLE`, `SUCURSAL_TIENE_USUARIOS_ACTIVOS`, `AREA_TIENE_EMPLEADOS`, `ULTIMO_SUPER_ADMIN` llegan como 400 (no están en el presenter). El frontend decide por código.
5. **Kardex del seed:** las salidas por venta las crea el trigger con `fecha = NOW()`, así que en el kardex aparecen con la fecha de ejecución del seed (las facturas sí tienen su fecha real).
6. Varios `.http` antiguos tienen la contraseña del super-admin escrita en claro; los escenarios nuevos no. No se tocaron (fuera de alcance), pero conviene limpiarlos.
7. En `openapi.doc.ts` hay endpoints antiguos con parámetros genéricos (`pagina`, `limite`, `activo`) que no aplican; se corrigieron los de usuarios y dashboard.
8. **Sin indicador de 2FA en la sesión:** `/auth/verificar` y el login no dicen si la cuenta ya tiene 2FA; la pantalla Mi cuenta ofrece configurar y desactivar sin saber el estado actual.
9. **Tokens en el cuerpo del login:** `POST /auth/login` devuelve `accessToken` y `refreshToken` en el JSON además de las cookies HttpOnly. El frontend no los guarda, pero quedan expuestos a JS; valorar quitarlos del cuerpo.
10. **Bug preexistente de zona horaria (BD):** los triggers que marcan `tokens_invalidados_en` usan `NOW()` con la zona del servidor MySQL (UTC-5), y la app compara en UTC. Resultado: al cambiar rol/estado de un usuario, sus sesiones abiertas no se cortan hasta ~5 h después. No se tocó (triggers/configuración de BD); solución sugerida: `default-time-zone=+00:00` en MySQL o `UTC_TIMESTAMP()` en los triggers.

## Demo expo (26/10/2026) — rama `feat/demo-expo` (local, sin push)

Avance para la exposición: flujo super admin → admin de sucursal → cajero → dashboards → vendedor B2B con datos reales. No es el producto terminado; solo se tocaron las rutas de ese flujo y la tipografía.

**Estado inicial limpio:** desde `Backend/`, `deno task seed:expo` (pide escribir el nombre de la BD) o `deno task seed:expo --yes --db=<DB_NAME>`. Deja roles/permisos, la Sede Principal (id=1) y `superadmin@warengine.local` sin 2FA (clave = `SEED_SUPERADMIN_PASSWORD`). **Borra todos los datos de negocio.**

**Prueba E2E:** con la API en 8017 y la BD recién sembrada, `deno run -A --env-file=.env scripts/e2e-expo.ts` (57 comprobaciones). Deja datos de prueba: volver a correr `seed:expo` después.

Cambios principales:
- Sesión (login, 2FA, `/auth/verificar`) con `nombre`, `sucursalId`, `sucursalNombre`; el front ya no asume la sede 1. Métricas/tendencias/ranking exigen `sucursalId` si el usuario tiene varias sedes (`SUCURSAL_REQUERIDA`).
- Endpoints nuevos de solo lectura: `GET /ventas/turnos/abiertos` y `GET /inventario/stock?sucursalId=` (acotados por alcance).
- Dashboard admin-sucursal con rutas `/ventas/*` y datos reales (sin ayer×0.75 ni meta fija). POS y B2B con stock real de la sede, sin cliente "Consumidor Final" implícito; B2B con IVA 0 como el backend (antes toda venta B2B fallaba por `PAGO_INVALIDO`).
- `database/client.ts`: sesión MySQL en UTC (`SET time_zone='+00:00'`): corrige horas corridas 5 h y el punto 10 de esta lista de riesgos.
- Fuente Outfit (`--font-ui`) en todas las vistas; Pixelify solo en `/acceso` (`.fuente-login`).
