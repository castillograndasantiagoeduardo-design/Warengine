/**
 * container.ts — Composition Root de Warengine.
 *
 * createContainer(env) es la función que conecta todos los paquetes:
 *   1. Lee la configuración validada del entorno.
 *   2. Crea el cliente de base de datos.
 *   3. Instancia los repositorios (database) pasándoles el cliente.
 *   4. Instancia los servicios técnicos (platform): jwt, hashing, mailer…
 *   5. Instancia los casos de uso (core) pasándoles los repositorios y servicios.
 *   6. Devuelve un objeto con todos los casos de uso listos para usar.
 *
 * apps/api y apps/mcp-server llaman a createContainer() en su main.ts y solo
 * usan el resultado. Nunca importan database ni platform directamente.
 *
 * REGLA: este archivo es el único "punto de acople" permitido. Si en
 * apps/api aparece un import de @warengine/database, es una violación.
 */

// TODO: implementar cuando existan los primeros casos de uso.

export type AppContainer = Record<PropertyKey, never>;
// Los casos de uso se agregarán aquí módulo por módulo.
// Ejemplo: { login: LoginUseCase; }


export function createContainer(_env: Record<string, string>): AppContainer {
  // TODO: instanciar repositorios, servicios y casos de uso.
  return {} as AppContainer;
}
