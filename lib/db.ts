import "server-only";

import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function hasDatabaseConfig() {
  return Boolean(
    process.env.BS_DB_HOST &&
      process.env.BS_DB_USER &&
      process.env.BS_DB_PASS &&
      process.env.BS_DB_NAME
  );
}

export function getDatabasePool() {
  if (!hasDatabaseConfig()) {
    return null;
  }

  if (!pool) {
    pool = mysql.createPool({
      host: process.env.BS_DB_HOST,
      port: Number(process.env.BS_DB_PORT || 3306),
      user: process.env.BS_DB_USER,
      password: process.env.BS_DB_PASS,
      database: process.env.BS_DB_NAME,
      charset: "utf8mb4",
      connectionLimit: 10,
      waitForConnections: true,
      dateStrings: true
    });
  }

  return pool;
}
