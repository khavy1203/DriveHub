'use strict';
require('dotenv').config(); // Đọc biến môi trường từ file .env

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const allConfig = require(__dirname + '/../config/config.js');
const config = allConfig[env] || allConfig.development;
const db = {};

let sequelize;
if (process.env.USE_ENV_VARIABLE === 'true') {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    timezone: config.timezone,
    define: config.define,
    logging: false,
    pool: config.pool,
  });
}

// Tải các model tự động từ thư mục này
fs.readdirSync(__dirname)
  .filter(file => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js')
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Thiết lập quan hệ giữa các model nếu có
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
