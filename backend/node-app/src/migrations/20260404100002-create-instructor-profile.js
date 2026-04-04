'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('instructor_profile')) return;

    await queryInterface.createTable('instructor_profile', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      userId: {
        type: Sequelize.INTEGER, allowNull: false, unique: true,
        references: { model: 'user', key: 'id' },
        onDelete: 'CASCADE',
      },
      cccd:                 { type: Sequelize.STRING(20),  allowNull: false },
      fullName:             { type: Sequelize.STRING(255), allowNull: false },
      gender:               { type: Sequelize.STRING(10),  allowNull: true },
      dateOfBirth:          { type: Sequelize.DATEONLY,     allowNull: true },
      residence:            { type: Sequelize.TEXT,         allowNull: true },
      gcnGvNumber:          { type: Sequelize.STRING(50),  allowNull: true },
      gcnCsNumber:          { type: Sequelize.STRING(50),  allowNull: true },
      gcnIssueDate:         { type: Sequelize.DATEONLY,     allowNull: true },
      gcnGvExpiry:          { type: Sequelize.DATEONLY,     allowNull: true },
      gcnCsExpiry:          { type: Sequelize.DATEONLY,     allowNull: true },
      teachingLicenseClass: { type: Sequelize.STRING(100), allowNull: true },
      licenseNumber:        { type: Sequelize.STRING(50),  allowNull: true },
      licenseClass:         { type: Sequelize.STRING(100), allowNull: true },
      qualification:        { type: Sequelize.STRING(255), allowNull: true },
      educationLevel:       { type: Sequelize.STRING(255), allowNull: true },
      seniority:            { type: Sequelize.STRING(100), allowNull: true },
      importedAt:           { type: Sequelize.DATE,        allowNull: true },
      createdAt:            { type: Sequelize.DATE,        allowNull: false },
      updatedAt:            { type: Sequelize.DATE,        allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('instructor_profile');
  },
};
