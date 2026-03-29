'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class group_api extends Model {
    static associate(models) {
      group_api.belongsTo(models.group, { foreignKey: 'groupId' });
      group_api.belongsTo(models.api_endpoint, { foreignKey: 'apiEndpointId' });
    }
  }

  group_api.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      groupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      apiEndpointId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'group_api',
      tableName: 'group_api',
      timestamps: true,
    },
  );

  return group_api;
};
