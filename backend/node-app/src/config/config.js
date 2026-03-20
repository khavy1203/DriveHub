require('dotenv').config();

const poolConfig = {
    max: 50,      // tối đa 50 connections đồng thời
    min: 5,       // giữ sẵn 5 connections
    acquire: 30000, // chờ tối đa 30s để lấy connection
    idle: 10000,    // đóng connection không dùng sau 10s
};

module.exports = {
    development: {
        username: 'root',
        password: '12345',
        database: 'userstatus',
        host: 'localhost',
        dialect: 'mysql',
        timezone: '+07:00',
        logging: false,
        define: { freezeTableName: true },
        pool: poolConfig,
    },
    test: {
        username: 'root',
        password: '12345',
        database: 'userstatus',
        host: 'localhost',
        dialect: 'mysql',
        timezone: '+07:00',
        logging: false,
        define: { freezeTableName: true },
        pool: poolConfig,
    },
    docker_production: {
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '12345',
        database: process.env.DB_DATABASE || 'userstatus',
        host: process.env.DB_HOST || 'mysql_db',
        dialect: 'mysql',
        timezone: '+07:00',
        logging: false,
        define: { freezeTableName: true },
        pool: poolConfig,
    },
    production: {
        username: 'ud3v7y6suym75ol8',
        password: '0RYXqOnOj4wJquQ5nlrP',
        database: 'b6i7q5qabwnazzwabegz',
        host: 'b6i7q5qabwnazzwabegz-mysql.services.clever-cloud.com',
        dialect: 'mysql',
        timezone: '+07:00',
        logging: false,
        define: { freezeTableName: true },
        port: 21053,
        pool: { ...poolConfig, max: 20 }, // Clever Cloud giới hạn connections
    },
    buildlocal: {
        username: 'root',
        password: '',
        database: 'userstatus',
        host: '127.0.0.1',
        dialect: 'mysql',
        timezone: '+07:00',
        logging: false,
        define: { freezeTableName: true },
        pool: poolConfig,
    },
};
