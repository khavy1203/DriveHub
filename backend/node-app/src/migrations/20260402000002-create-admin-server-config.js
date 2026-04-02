'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('admin_server_config')) return;

    await queryInterface.createTable('admin_server_config', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      adminId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'user', key: 'id' },
        onDelete: 'CASCADE',
      },
      apiBaseUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
      apiKey: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      lastTestedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      lastTestStatus: {
        type: Sequelize.ENUM('success', 'error', 'untested'),
        allowNull: false,
        defaultValue: 'untested',
      },
      lastTestMessage: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('admin_server_config');
  },
};
