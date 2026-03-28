'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class kqsh_thisinh extends Model {
    static associate(models) {
      kqsh_thisinh.belongsTo(models.hoc_vien, {
        foreignKey: 'hocVienId',
        as: 'hocVien',
      });
      kqsh_thisinh.hasMany(models.kqsh_subjects, {
        foreignKey: 'thisinhId',
        as: 'subjects',
      });
    }
  }

  kqsh_thisinh.init(
    {
      id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      hocVienId:    { type: DataTypes.INTEGER, allowNull: true },
      SoCCCD:       { type: DataTypes.STRING(20), allowNull: false },
      MaKySH:       { type: DataTypes.STRING(50), allowNull: false },
      SoBaoDanh:    { type: DataTypes.INTEGER, allowNull: false },
      HoVaTen:      { type: DataTypes.STRING(255), allowNull: true },
      NgaySinh:     { type: DataTypes.STRING(20), allowNull: true },
      HangGPLX:     { type: DataTypes.STRING(10), allowNull: true },
      MaKhoaHoc:    { type: DataTypes.STRING(50), allowNull: true },
      NgaySH:       { type: DataTypes.DATE, allowNull: true },
      KetQuaSH:     { type: DataTypes.STRING(10), allowNull: true },
      DiemLyThuyet: { type: DataTypes.FLOAT, allowNull: true },
      DiemHinh:     { type: DataTypes.FLOAT, allowNull: true },
      DiemDuong:    { type: DataTypes.FLOAT, allowNull: true },
      DiemMoPhong:  { type: DataTypes.FLOAT, allowNull: true },
      SoQDSH:       { type: DataTypes.STRING(100), allowNull: true },
    },
    {
      sequelize,
      modelName: 'kqsh_thisinh',
      tableName: 'kqsh_thisinh',
      timestamps: true,
    }
  );

  return kqsh_thisinh;
};
