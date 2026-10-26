# PROGRESO-SA.md — Panel del Super Admin (Warengine)

> Demo: lunes 26 de octubre de 2026 · Rama: `feat/sa-base` (sin push)
> Última actualización: domingo 25/10/2026 — Fase A (backend) terminada; Fase B en curso.

## Estado por fase

| Fase | Alcance | Estado |
| :--- | :--- | :--- |
| Base (12 commits previos) | Kit UI, shell, selector `/dashboard`, dashboard global, sucursales + detalle + áreas, empleados + salarios | ✅ Hecho |
| **A — Backend** | roles, resumen, permisos globales, usuarios paginados, auditoría, seed demo, docs | ✅ Hecho (pendiente prueba en vivo, ver Dudas) |
| **B — P0** | Autorización por permisos en la UI, Usuarios y roles, Auditoría | 🔄 En curso |
| **C — P1** | Alertas administrativas y de stock, Cuenta 2FA | ⏳ Pendiente |
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
| A7 Documentación | `Docs/infraestructura/api.md` §6 (contrato real), `Docs/modulos/administracion.md` corregido; 34/34 rutas en OpenAPI y `Http/` | (este commit) |

Verificación tras cada paso: `deno task check` ✅ · `lint` sin problemas nuevos (235 preexistentes) ✅ · `deno task test` 381/381 ✅.

## Fase B — en curso

- [ ] Autorización de la UI por permisos (sin atajo super-admin) y estado 403 desde la API
- [ ] Usuarios y roles (`/dashboard/usuarios`)
- [ ] Auditoría (`/dashboard/auditoria`)

## Dudas y riesgos abiertos

1. **Prueba en vivo pendiente:** faltan `WARENGINE_SA_PASSWORD` y `SEED_DEMO_PASSWORD` en `Backend/.env`. Sin ellas no se ejecutó `seed:demo` ni se probó el login contra la API real.
2. **Impacto en la vista del admin de sucursal (A3):** el admin de sucursal ya no puede pedir `/dashboard/metricas`, `/rendimiento`, `/ranking` ni `/inventario` (403). Su vista debe usar `/dashboard/tendencias` u otras fuentes. Avisar a quien construye esa vista.
3. **GEMINI.md** pide `Result.err(...)`; la API real de `Result` es `Result.fail(...)`. Se usa `fail`.
4. **Códigos 400 vs 422:** `SEDE_PRINCIPAL_NO_INACTIVABLE`, `SUCURSAL_TIENE_USUARIOS_ACTIVOS`, `AREA_TIENE_EMPLEADOS`, `ULTIMO_SUPER_ADMIN` llegan como 400 (no están en el presenter). El frontend decide por código.
5. **Kardex del seed:** las salidas por venta las crea el trigger con `fecha = NOW()`, así que en el kardex aparecen con la fecha de ejecución del seed (las facturas sí tienen su fecha real).
6. Varios `.http` antiguos tienen la contraseña del super-admin escrita en claro; los escenarios nuevos no. No se tocaron (fuera de alcance), pero conviene limpiarlos.
7. En `openapi.doc.ts` hay endpoints antiguos con parámetros genéricos (`pagina`, `limite`, `activo`) que no aplican; se corrigieron los de usuarios y dashboard.
