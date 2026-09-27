# SHARED/ — Código compartido entre BACK y FRONT

Esta carpeta contiene el paquete `contracts`, que es la única fuente de verdad
para los DTOs y esquemas de validación Zod que usan tanto el backend como el frontend.

**Qué va aquí:** esquemas Zod, tipos TypeScript inferidos de esos esquemas,
constantes de roles, permisos y nombres de Tools del MCP.

**Qué NO va aquí:** lógica de negocio, reglas de dominio, código que dependa
de Deno, Node.js, React, Drizzle o cualquier librería que no sea `zod`.
