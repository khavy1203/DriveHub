'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class notification_attachment extends Model {
    static associate(models) {
      notification_attachment.belongsTo(models.notification, {
        foreignKey: 'notificationId',
        as: 'notification',
      });
    }
  }

  notification_attachment.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      notificationId: { type: DataTypes.INTEGER, allowNull: false },
      fileName: { type: DataTypes.STRING(255), allowNull: false },
      filePath: { type: DataTypes.STRING(512), allowNull: false },
      fileType: { type: DataTypes.STRING(100), allowNull: false },
      fileSize: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      sequelize,
      modelName: 'notification_attachment',
      tableName: 'notification_attachment',
      timestamps: true,
      updatedAt: false,
    }
  );

  return notification_attachment;
};
