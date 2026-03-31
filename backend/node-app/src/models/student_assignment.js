'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class student_assignment extends Model {
    static associate(models) {
      student_assignment.belongsTo(models.hoc_vien, {
        foreignKey: 'hocVienId',
        as: 'hocVien',
      });
      student_assignment.belongsTo(models.user, {
        foreignKey: 'teacherId',
        as: 'teacher',
      });
      student_assignment.belongsTo(models.khoahoc, {
        foreignKey: 'courseId',
        as: 'course',
      });
    }
  }

  student_assignment.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      hocVienId: { type: DataTypes.INTEGER, allowNull: false },
      teacherId: { type: DataTypes.INTEGER, allowNull: false },
      courseId: { type: DataTypes.STRING(20), allowNull: true, defaultValue: null },
      status: {
        type: DataTypes.ENUM('waiting', 'learning', 'completed'),
        allowNull: false,
        defaultValue: 'waiting',
      },
      progressPercent: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      datHoursCompleted: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      notes: { type: DataTypes.TEXT, allowNull: true },
      role: {
        type: DataTypes.ENUM('primary', 'supervisor'),
        allowNull: false,
        defaultValue: 'primary',
      },
    },
    {
      sequelize,
      modelName: 'student_assignment',
      tableName: 'student_assignment',
      timestamps: true,
    }
  );

  return student_assignment;
};
