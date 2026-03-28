'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('user');
    if (!tableDesc.thisinhId) {
      await queryInterface.addColumn('user', 'thisinhId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: { model: 'thisinh', key: 'IDThiSinh' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('user');
    if (tableDesc.thisinhId) {
      await queryInterface.removeColumn('user', 'thisinhId');
    }
  },
};
