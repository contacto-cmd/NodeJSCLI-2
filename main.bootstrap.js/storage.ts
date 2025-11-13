import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { transacciones, certificados, verificaciones, nodos, blockchain } from '../shared/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export {
  transacciones,
  certificados,
  verificaciones,
  nodos,
  blockchain
};
