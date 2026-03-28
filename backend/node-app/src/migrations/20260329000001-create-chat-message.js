'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('chat_message')) {
      await queryInterface.createTable('chat_message', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        assignmentId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'student_assignment', key: 'id' },
          onDelete: 'CASCADE',
        },
        senderUserId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'user', key: 'id' },
          onDelete: 'CASCADE',
        },
        senderRole: {
          type: Sequelize.ENUM('teacher', 'student'),
          allowNull: false,
        },
        body: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        readAt: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
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

      await queryInterface.addIndex('chat_message', ['assignmentId', 'createdAt'], {
        name: 'idx_chat_assignment_created',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('chat_message');
  },
};
