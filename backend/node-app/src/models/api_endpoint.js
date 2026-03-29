'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class api_endpoint extends Model {
    static associate(models) {
      api_endpoint.belongsToMany(models.group, {
        through: models.group_api,
        foreignKey: 'apiEndpointId',
        otherKey: 'groupId',
        as: 'groups',
      });
    }
  }

  api_endpoint.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      method: {
        type: DataTypes.ENUM('GET', 'POST', 'PUT', 'DELETE', 'ALL'),
        allowNull: false,
      },
      path: {
        type: DataTypes.STRING(191),
        allowNull: false,
      },
      pattern: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },
      featureGroup: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'api_endpoint',
      tableName: 'api_endpoint',
      timestamps: true,
    },
  );

  return api_endpoint;
};
