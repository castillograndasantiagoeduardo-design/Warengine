/**
 * main.ts — Punto de entrada del servidor MCP de Warengine.
 *
 * Responsabilidades de este archivo:
 *  1. Leer la configuración del entorno (puerto, host, CORS).
 *  2. Crear el contenedor de dependencias (composition root).
 *  3. Iniciar el servidor MCP HTTP con transporte SSE.
 *  4. Gestionar apagado controlado (graceful shutdown).
 *
 * PROHIBIDO en este archivo (ADR 0001, Regla 6):
 *  - Lógica de negocio o de autorización.
 *  - Importaciones directas de Drizzle, repositorios o entidades de dominio.
 *  - Validación de permisos dentro del archivo (eso lo hace el gateway).
 */

import { createContainer } from '@warengine/composition';
import { createMcpHttpServer } from './server.ts';

function main() {
  const port = Number(Deno.env.get('MCP_PORT') || 3002);
  const host = Deno.env.get('MCP_HOST') || '0.0.0.0';
  const corsOrigenes = Deno.env.get('CORS_ORIGENES') || 'http://localhost:3000';

  console.log('[mcp-server] Inicializando Composition Root...');
  const container = createContainer();

  console.log(`[mcp-server] Configurando servidor MCP en ${host}:${port}...`);
  const server = createMcpHttpServer(container, {
    port,
    host,
    corsOrigenes,
  });

  server.listen(port, host, () => {
    console.log(`[mcp-server] Servidor MCP activo en http://${host}:${port}`);
    console.log(`[mcp-server]  -> Canal SSE:    http://${host}:${port}/sse`);
    console.log(`[mcp-server]  -> Mensajes POST: http://${host}:${port}/message`);
    console.log(`[mcp-server]  -> Health Check: http://${host}:${port}/health`);
  });

  // Manejo de apagado ordenado ante señales del sistema operativo
  const apagarServidor = () => {
    console.log('\n[mcp-server] Cerrando servidor MCP de forma controlada...');
    server.close(() => {
      console.log('[mcp-server] Conexiones cerradas. Proceso finalizado.');
      Deno.exit(0);
    });
  };

  try {
    Deno.addSignalListener('SIGINT', apagarServidor);
    Deno.addSignalListener('SIGTERM', apagarServidor);
  } catch (_e) {
    // En Windows algunas señales pueden requerir manejo adicional
  }
}

if (import.meta.main) {
  main();
}
