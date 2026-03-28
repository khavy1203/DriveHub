'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class khoahoc extends Model {
    static associate(models) {
      // Quan hệ một-nhiều với thisinh
      khoahoc.hasMany(models.thisinh, {
        foreignKey: 'IDKhoaHoc',
      });
      khoahoc.belongsToMany(models.user, {
        through: models.teacher_course,
        foreignKey: 'courseId',
        otherKey: 'teacherId',
        as: 'assignedTeachers',
      });
    }
  }
  khoahoc.init({
    IDKhoaHoc: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false,
    },
    TenKhoaHoc: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    IDDonVi: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    NgayThi: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    NamHoc: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    Thi: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    HoiDong: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    TrungTam: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    TrangThai: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'khoahoc',
    tableName: 'khoahoc',
    timestamps: false,
  });
  return khoahoc;
};
