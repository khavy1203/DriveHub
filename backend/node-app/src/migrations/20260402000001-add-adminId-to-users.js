'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = await queryInterface.describeTable('user');
    if (!cols.adminId) {
      await queryInterface.addColumn('user', 'adminId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: { model: 'user', key: 'id' },
        onDelete: 'SET NULL',
        after: 'superTeacherId',
      });
    }
  },

  async down(queryInterface) {
    const cols = await queryInterface.describeTable('user');
    if (cols.adminId) {
      await queryInterface.removeColumn('user', 'adminId');
    }
  },
};
