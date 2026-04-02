'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class admin_server_config extends Model {
    static associate(models) {
      admin_server_config.belongsTo(models.user, {
        foreignKey: 'adminId',
        as: 'admin',
      });
    }
  }

  admin_server_config.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      adminId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      apiBaseUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
      apiKey: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      lastTestedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      lastTestStatus: {
        type: DataTypes.ENUM('success', 'error', 'untested'),
        allowNull: false,
        defaultValue: 'untested',
      },
      lastTestMessage: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName: 'admin_server_config',
      tableName: 'admin_server_config',
      timestamps: true,
    }
  );

  return admin_server_config;
};
