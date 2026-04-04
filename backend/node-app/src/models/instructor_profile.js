'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class instructor_profile extends Model {
    static associate(models) {
      instructor_profile.belongsTo(models.user, {
        foreignKey: 'userId',
        as: 'user',
      });
    }
  }

  instructor_profile.init(
    {
      id:                   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId:               { type: DataTypes.INTEGER, allowNull: false, unique: true },
      cccd:                 { type: DataTypes.STRING(20),  allowNull: false },
      fullName:             { type: DataTypes.STRING(255), allowNull: false },
      gender:               { type: DataTypes.STRING(10),  allowNull: true },
      dateOfBirth:          { type: DataTypes.DATEONLY,     allowNull: true },
      residence:            { type: DataTypes.TEXT,         allowNull: true },
      gcnGvNumber:          { type: DataTypes.STRING(50),  allowNull: true },
      gcnCsNumber:          { type: DataTypes.STRING(50),  allowNull: true },
      gcnIssueDate:         { type: DataTypes.DATEONLY,     allowNull: true },
      gcnGvExpiry:          { type: DataTypes.DATEONLY,     allowNull: true },
      gcnCsExpiry:          { type: DataTypes.DATEONLY,     allowNull: true },
      teachingLicenseClass: { type: DataTypes.STRING(100), allowNull: true },
      licenseNumber:        { type: DataTypes.STRING(50),  allowNull: true },
      licenseClass:         { type: DataTypes.STRING(100), allowNull: true },
      qualification:        { type: DataTypes.STRING(255), allowNull: true },
      educationLevel:       { type: DataTypes.STRING(255), allowNull: true },
      seniority:            { type: DataTypes.STRING(100), allowNull: true },
      importedAt:           { type: DataTypes.DATE,        allowNull: true },
    },
    {
      sequelize,
      modelName: 'instructor_profile',
      tableName: 'instructor_profile',
      timestamps: true,
    }
  );

  return instructor_profile;
};
