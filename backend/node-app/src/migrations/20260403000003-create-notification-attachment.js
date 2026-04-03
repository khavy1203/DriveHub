'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.describeTable('notification_attachment').catch(() => null);
    if (tableExists) return;

    await queryInterface.createTable('notification_attachment', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      notificationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'notification', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      fileName: { type: Sequelize.STRING(255), allowNull: false },
      filePath: { type: Sequelize.STRING(512), allowNull: false },
      fileType: { type: Sequelize.STRING(100), allowNull: false },
      fileSize: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('notification_attachment', ['notificationId'], { name: 'idx_na_notification' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notification_attachment');
  },
};
