'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class kqsh_subjects extends Model {
    static associate(models) {
      kqsh_subjects.belongsTo(models.kqsh_thisinh, {
        foreignKey: 'thisinhId',
        as: 'thisinh',
      });
    }
  }

  kqsh_subjects.init(
    {
      id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      thisinhId:    { type: DataTypes.INTEGER, allowNull: false },
      MaKySH:       { type: DataTypes.STRING(50), allowNull: false },
      SoBaoDanh:    { type: DataTypes.INTEGER, allowNull: false },
      LoaiSH:       { type: DataTypes.STRING(10), allowNull: true },
      NgaySH:       { type: DataTypes.DATE, allowNull: true },
      DiemSH:       { type: DataTypes.FLOAT, allowNull: true },
      DiemToiDa:    { type: DataTypes.FLOAT, allowNull: true },
      DiemToiThieu: { type: DataTypes.FLOAT, allowNull: true },
      VangSH:       { type: DataTypes.TINYINT, allowNull: true },
      KetQuaSH:     { type: DataTypes.STRING(10), allowNull: true },
    },
    {
      sequelize,
      modelName: 'kqsh_subjects',
      tableName: 'kqsh_subjects',
      timestamps: true,
    }
  );

  return kqsh_subjects;
};
