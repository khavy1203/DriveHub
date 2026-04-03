'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class notification extends Model {
    static associate(models) {
      notification.belongsTo(models.user, {
        foreignKey: 'createdByUserId',
        as: 'creator',
      });
      notification.hasMany(models.notification_recipient, {
        foreignKey: 'notificationId',
        as: 'recipients',
      });
      notification.hasMany(models.notification_attachment, {
        foreignKey: 'notificationId',
        as: 'attachments',
      });
    }
  }

  notification.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      title: { type: DataTypes.STRING(255), allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: false },
      type: { type: DataTypes.ENUM('admin_to_st', 'admin_to_student'), allowNull: false },
      targetScope: { type: DataTypes.ENUM('all', 'selected'), allowNull: false, defaultValue: 'all' },
      priority: { type: DataTypes.ENUM('normal', 'important'), allowNull: false, defaultValue: 'normal' },
      createdByUserId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: 'notification',
      tableName: 'notification',
      timestamps: true,
    }
  );

  return notification;
};
