require('dotenv').config();

const poolConfig = {
  max: 50,
  min: 5,
  acquire: 30000,
  idle: 10000,
};

/**
 * MySQL — chỉ lấy từ env (hoặc alias DB_NAME / DB_USER / DB_PASS).
 * Không hardcode tài khoản / mật khẩu trong repo.
 */
function mysqlConfig(poolExtra = null) {
  const username = process.env.DB_USERNAME || process.env.DB_USER || '';
  const password = process.env.DB_PASSWORD || process.env.DB_PASS || '';
  const database = process.env.DB_DATABASE || process.env.DB_NAME || 'userstatus';
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

  const pool = poolExtra ? { ...poolConfig, ...poolExtra } : poolConfig;

  return {
    username,
    password,
    database,
    host,
    port,
    dialect: 'mysql',
    timezone: process.env.TIMEZONE || '+07:00',
    logging: false,
    define: { freezeTableName: true },
    pool,
  };
}

module.exports = {
  development: mysqlConfig(),
  test: mysqlConfig(),
  docker_production: mysqlConfig(),
  docker_test: mysqlConfig(),
  production: mysqlConfig({ max: 20 }),
  buildlocal: mysqlConfig(),
};
