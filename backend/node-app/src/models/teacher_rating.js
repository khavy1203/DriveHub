'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class teacher_rating extends Model {
    static associate(models) {
      teacher_rating.belongsTo(models.user, {
        foreignKey: 'teacherUserId',
        as: 'teacher',
      });
      teacher_rating.belongsTo(models.hoc_vien, {
        foreignKey: 'hocVienId',
        as: 'hocVien',
      });
    }
  }

  teacher_rating.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      teacherUserId: { type: DataTypes.INTEGER, allowNull: false },
      hocVienId: { type: DataTypes.INTEGER, allowNull: false },
      stars: { type: DataTypes.INTEGER, allowNull: false },
      comment: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: 'teacher_rating',
      tableName: 'teacher_rating',
      timestamps: true,
    }
  );

  return teacher_rating;
};
