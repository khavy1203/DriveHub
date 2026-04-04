'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.describeTable('notification_recipient').catch(() => null);
    if (tableExists) return;

    await queryInterface.createTable('notification_recipient', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      notificationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'notification', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      recipientUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'user', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      recipientHocVienId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'hoc_vien', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      isRead: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      readAt: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      createdAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('notification_recipient', ['recipientUserId', 'isRead'], { name: 'idx_nr_user_read' });
    await queryInterface.addIndex('notification_recipient', ['recipientHocVienId', 'isRead'], { name: 'idx_nr_hv_read' });
    await queryInterface.addIndex('notification_recipient', ['notificationId'], { name: 'idx_nr_notification' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notification_recipient');
  },
};
