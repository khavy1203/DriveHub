'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class training_snapshot extends Model {
    static associate(models) {
      training_snapshot.belongsTo(models.hoc_vien, {
        foreignKey: 'hocVienId',
        as: 'hocVien',
      });
    }
  }

  training_snapshot.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      hocVienId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      cccd: { type: DataTypes.STRING(20), allowNull: false },
      rawJson: { type: DataTypes.TEXT('long'), allowNull: false },
      courseProgressPct: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      syncStatus: {
        type: DataTypes.ENUM('success', 'error', 'pending'),
        allowNull: false,
        defaultValue: 'pending',
      },
      syncError: { type: DataTypes.TEXT, allowNull: true },
      lastSyncAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: 'training_snapshot',
      tableName: 'training_snapshot',
      timestamps: true,
    },
  );

  return training_snapshot;
};
