'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class notification_recipient extends Model {
    static associate(models) {
      notification_recipient.belongsTo(models.notification, {
        foreignKey: 'notificationId',
        as: 'notification',
      });
      notification_recipient.belongsTo(models.user, {
        foreignKey: 'recipientUserId',
        as: 'recipientUser',
      });
      notification_recipient.belongsTo(models.hoc_vien, {
        foreignKey: 'recipientHocVienId',
        as: 'recipientHocVien',
      });
    }
  }

  notification_recipient.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      notificationId: { type: DataTypes.INTEGER, allowNull: false },
      recipientUserId: { type: DataTypes.INTEGER, allowNull: true },
      recipientHocVienId: { type: DataTypes.INTEGER, allowNull: true },
      isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      readAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    },
    {
      sequelize,
      modelName: 'notification_recipient',
      tableName: 'notification_recipient',
      timestamps: true,
      updatedAt: false,
    }
  );

  return notification_recipient;
};
