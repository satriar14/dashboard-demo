import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.MAIN_DB_HOST,
  port: parseInt(process.env.MAIN_DB_PORT || '5440'),
  database: process.env.MAIN_DB_NAME,
  user: process.env.MAIN_DB_USERNAME,
  password: process.env.MAIN_DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
