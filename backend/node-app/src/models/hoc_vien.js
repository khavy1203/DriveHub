'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class hoc_vien extends Model {
    static associate(models) {
      hoc_vien.belongsTo(models.user, {
        foreignKey: 'userId',
        as: 'account',
      });
      hoc_vien.belongsTo(models.user, {
        foreignKey: 'superTeacherId',
        as: 'superTeacher',
      });
      hoc_vien.belongsTo(models.khoahoc, {
        foreignKey: 'IDKhoaHoc',
        as: 'khoahoc',
      });
      hoc_vien.hasOne(models.student_assignment, {
        foreignKey: 'hocVienId',
        as: 'assignment',
      });
      hoc_vien.hasMany(models.student_assignment, {
        foreignKey: 'hocVienId',
        as: 'assignments',
      });
      hoc_vien.hasOne(models.training_snapshot, {
        foreignKey: 'hocVienId',
        as: 'trainingSnapshot',
      });
    }
  }

  hoc_vien.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      HoTen: { type: DataTypes.STRING(255), allowNull: false },
      NgaySinh: { type: DataTypes.DATEONLY, allowNull: true },
      GioiTinh: { type: DataTypes.STRING(10), allowNull: true },
      SoCCCD: { type: DataTypes.STRING(20), allowNull: true },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true },
      DiaChi: { type: DataTypes.STRING(255), allowNull: true },
      loaibangthi: { type: DataTypes.STRING(20), allowNull: true },
      GplxDaCo: { type: DataTypes.STRING(100), allowNull: true },
      GhiChu: { type: DataTypes.TEXT, allowNull: true },
      IDKhoaHoc: { type: DataTypes.STRING(20), allowNull: true },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      superTeacherId: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
      adminId: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
      avatarUrl: { type: DataTypes.STRING(512), allowNull: true },
      status: {
        type: DataTypes.ENUM('registered', 'assigned', 'learning', 'dat_completed', 'exam_ready', 'dropped'),
        allowNull: false,
        defaultValue: 'registered',
      },
    },
    {
      sequelize,
      modelName: 'hoc_vien',
      tableName: 'hoc_vien',
      timestamps: true,
    }
  );

  return hoc_vien;
};
