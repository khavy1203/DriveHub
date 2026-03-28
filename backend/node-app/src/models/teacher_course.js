'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class teacher_course extends Model {
    static associate(models) {
      teacher_course.belongsTo(models.user, { foreignKey: 'teacherId' });
      teacher_course.belongsTo(models.khoahoc, { foreignKey: 'courseId' });
    }
  }
  teacher_course.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    teacherId: { type: DataTypes.INTEGER, allowNull: false },
    courseId: { type: DataTypes.STRING(20), allowNull: false },
  }, {
    sequelize,
    modelName: 'teacher_course',
    tableName: 'teacher_course',
    timestamps: true,
  });
  return teacher_course;
};
