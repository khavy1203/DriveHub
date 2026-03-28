'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class chat_message extends Model {
    static associate(models) {
      chat_message.belongsTo(models.student_assignment, {
        foreignKey: 'assignmentId',
        as: 'assignment',
      });
      chat_message.belongsTo(models.user, {
        foreignKey: 'senderUserId',
        as: 'sender',
      });
    }
  }

  chat_message.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      assignmentId: { type: DataTypes.INTEGER, allowNull: false },
      senderUserId: { type: DataTypes.INTEGER, allowNull: false },
      senderRole: { type: DataTypes.ENUM('teacher', 'student'), allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
      deliveredAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
      readAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    },
    {
      sequelize,
      modelName: 'chat_message',
      tableName: 'chat_message',
      timestamps: true,
    }
  );

  return chat_message;
};
