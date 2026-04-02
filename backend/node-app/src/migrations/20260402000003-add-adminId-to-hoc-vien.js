'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('hoc_vien');
    if (!table.adminId) {
      await queryInterface.addColumn('hoc_vien', 'adminId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: { model: 'user', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        after: 'superTeacherId',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('hoc_vien');
    if (table.adminId) {
      await queryInterface.removeColumn('hoc_vien', 'adminId');
    }
  },
};
