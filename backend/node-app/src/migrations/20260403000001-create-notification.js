'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.describeTable('notification').catch(() => null);
    if (tableExists) return;

    await queryInterface.createTable('notification', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      type: { type: Sequelize.ENUM('admin_to_st', 'admin_to_student'), allowNull: false },
      targetScope: { type: Sequelize.ENUM('all', 'selected'), allowNull: false, defaultValue: 'all' },
      priority: { type: Sequelize.ENUM('normal', 'important'), allowNull: false, defaultValue: 'normal' },
      createdByUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'user', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notification');
  },
};
