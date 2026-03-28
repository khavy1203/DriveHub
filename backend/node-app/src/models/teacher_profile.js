'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class teacher_profile extends Model {
    static associate(models) {
      teacher_profile.belongsTo(models.user, {
        foreignKey: 'userId',
        as: 'user',
      });
    }
  }

  teacher_profile.init(
    {
      userId: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
      bio: { type: DataTypes.TEXT, allowNull: true },
      licenseTypes: { type: DataTypes.STRING(100), allowNull: true },
      locationName: { type: DataTypes.STRING(200), allowNull: true },
      avatarUrl: { type: DataTypes.STRING(500), allowNull: true },
      yearsExp: { type: DataTypes.INTEGER, allowNull: true },
      isActive: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
    },
    {
      sequelize,
      modelName: 'teacher_profile',
      tableName: 'teacher_profile',
      timestamps: true,
    }
  );

  return teacher_profile;
};
