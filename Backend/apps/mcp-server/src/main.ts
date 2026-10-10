/**
 * main.ts — Punto de entrada del servidor MCP de Warengine.
 *
 * Responsabilidades de este archivo:
 *  1. Leer la configuración del entorno.
 *  2. Crear el contenedor de dependencias (composition root).
 *  3. Registrar el catálogo de Tools y el gateway de autorización.
 *  4. Arrancar el servidor MCP en el puerto configurado.
 *
 * PROHIBIDO en este archivo:
 *  - Lógica de negocio o de autorización.
 *  - Importaciones directas de Drizzle, repositorios o entidades de dominio.
 *  - Validación de permisos (eso lo hace el gateway, no el main).
 */

// TODO: implementar cuando se integre el SDK del protocolo MCP.
