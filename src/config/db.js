const { Sequelize } = require('sequelize');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = process.env.MYSQL_URL 
  ? new Sequelize(process.env.MYSQL_URL, {
      dialect: 'mysql',
      logging: false,
      dialectOptions: isProduction ? {
        ssl: {
          rejectUnauthorized: false
        }
      } : {}
    })
  : new Sequelize(
      process.env.DB_NAME || 'courtmatch',
      process.env.DB_USER || 'root',
      process.env.DB_PASS || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
      }
    );

module.exports = sequelize;