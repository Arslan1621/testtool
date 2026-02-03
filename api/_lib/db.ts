import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
// import * as schema from "../../shared/schema";
import * as schema from "../../shared/schema.js";
const { Pool } = pg;

let pool: pg.Pool | null = null;
let database: ReturnType<typeof drizzle> | null = null;

function getPool() {
  if (!pool) {
    const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("NEON_DATABASE_URL or DATABASE_URL must be set");
    }
    pool = new Pool({ 
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

export function getDb() {
  if (!database) {
    database = drizzle(getPool(), { schema });
  }
  return database;
}

export { getPool as pool };
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    return (getDb() as any)[prop];
  }
});
