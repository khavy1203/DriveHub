'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('teacher_profile')) return;
    await queryInterface.createTable('teacher_profile', {
      userId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: 'user', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      bio: { type: Sequelize.TEXT, allowNull: true },
      licenseTypes: { type: Sequelize.STRING(100), allowNull: true },
      locationName: { type: Sequelize.STRING(200), allowNull: true },
      avatarUrl: { type: Sequelize.STRING(500), allowNull: true },
      yearsExp: { type: Sequelize.INTEGER, allowNull: true },
      isActive: { type: Sequelize.TINYINT, allowNull: false, defaultValue: 1 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('teacher_profile');
  },
};
