import sql from 'mssql';

function buildConfig() {
  const server = process.env.MSSQL_HOST;
  const user = process.env.MSSQL_USER;
  const password = process.env.MSSQL_PASSWORD;
  const database = process.env.MSSQL_DATABASE;
  const port = Number(process.env.MSSQL_PORT || 1433);

  if (!server || !user || !database) {
    throw new Error(
      'MSSQL sync requires MSSQL_HOST, MSSQL_USER, MSSQL_DATABASE (optional MSSQL_PASSWORD, MSSQL_PORT)',
    );
  }

  return {
    server,
    port,
    user,
    password: password ?? '',
    database,
    options: {
      encrypt: process.env.MSSQL_ENCRYPT === 'true',
      trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE !== 'false',
    },
    connectionTimeout: Number(process.env.MSSQL_CONNECTION_TIMEOUT_MS || 15000),
    requestTimeout: Number(process.env.MSSQL_REQUEST_TIMEOUT_MS || 30000),
  };
}

let pool = null;

export async function getMssqlPool() {
  if (!pool || !pool.connected) {
    pool = await sql.connect(buildConfig());
  }
  return pool;
}

export async function closeMssqlPool() {
  if (pool && pool.connected) {
    await pool.close();
    pool = null;
  }
}
