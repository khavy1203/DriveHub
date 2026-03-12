'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class authsession extends Model {
    static associate(models) {
      authsession.belongsTo(models.user, {
        foreignKey: 'userId',
      });
    }
  }

  authsession.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      sessionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      ip: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      revoked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'authsession',
      tableName: 'authsession',
      timestamps: true,
    }
  );

  return authsession;
};
