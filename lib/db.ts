import mysql from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var mysqlPool: mysql.Pool | undefined;
}

// Global singleton pool for Next.js serverless and development environments
export const pool =
  globalThis.mysqlPool ||
  mysql.createPool({
    host: process.env.DB_HOST || 'mysql-1a238f5c-mail-ffb3.i.aivencloud.com',
    port: Number(process.env.DB_PORT) || 22717,
    user: process.env.DB_USER || 'avnadmin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'myfinbook_db',
    ssl: {
      rejectUnauthorized: false,
    },
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 10000,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 60000,
    queueLimit: 0,
  });

globalThis.mysqlPool = pool;

export default pool;
