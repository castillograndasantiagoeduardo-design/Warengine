import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema/index.ts';

export type Database = MySql2Database<typeof schema>;

let pool: mysql.Pool | null = null;
let dbInstance: Database | null = null;

export interface DatabaseConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

/**
 * getDatabase — Obtiene o inicializa la instancia singleton de Drizzle ORM sobre MySQL.
 *
 * Configura la conexión de mysql2 con `timezone: 'Z'` (UTC estricto) según
 * la regla de arquitectura 7.3, indispensable para que las comparaciones entre
 * `iat` del JWT y `tokens_invalidados_en` operen en la misma zona horaria.
 */
export function getDatabase(config?: DatabaseConfig): Database {
  if (dbInstance) {
    return dbInstance;
  }

  const host = config?.host ?? Deno.env.get('DB_HOST') ?? 'localhost';
  const port = config?.port ?? Number(Deno.env.get('DB_PORT') ?? 3306);
  const user = config?.user ?? Deno.env.get('DB_USER') ?? 'warengine_user';
  const password = config?.password ?? Deno.env.get('DB_PASSWORD') ?? '';
  const database = config?.database ?? Deno.env.get('DB_NAME') ?? 'warengine';

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    timezone: 'Z',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  dbInstance = drizzle(pool, { schema, mode: 'default' });
  return dbInstance;
}

/**
 * closeDatabase — Cierra el pool de conexiones de MySQL (útil para tests o shutdown).
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    dbInstance = null;
  }
}
