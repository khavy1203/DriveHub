'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Gplx extends Model {
    static associate(models) {}
  }
  Gplx.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    ma_dang_ky: { type: DataTypes.STRING(100), allowNull: true },
    ho_ten: { type: DataTypes.STRING(200), allowNull: true },
    ngay_sinh: { type: DataTypes.DATEONLY, allowNull: true },
    so_cmnd_cccd: { type: DataTypes.STRING(30), allowNull: true },
    so_gplx: { type: DataTypes.STRING(30), allowNull: true },
    hang: { type: DataTypes.STRING(10), allowNull: true },
    ket_qua_xac_thuc: { type: DataTypes.STRING(50), allowNull: true },
    ly_do_tu_choi: { type: DataTypes.TEXT, allowNull: true },
  }, {
    sequelize,
    modelName: 'Gplx',
    tableName: 'gplx',
    timestamps: true,
  });
  return Gplx;
};
