'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const exists = await queryInterface.describeTable('training_snapshot').catch(() => null);
    if (exists) return;

    await queryInterface.createTable('training_snapshot', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      hocVienId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'hoc_vien', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      cccd: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      rawJson: {
        type: Sequelize.TEXT('long'),
        allowNull: false,
      },
      courseProgressPct: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      syncStatus: {
        type: Sequelize.ENUM('success', 'error', 'pending'),
        allowNull: false,
        defaultValue: 'pending',
      },
      syncError: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lastSyncAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('training_snapshot', ['cccd'], { name: 'idx_training_snapshot_cccd' });
    await queryInterface.addIndex('training_snapshot', ['syncStatus'], { name: 'idx_training_snapshot_status' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('training_snapshot');
  },
};
