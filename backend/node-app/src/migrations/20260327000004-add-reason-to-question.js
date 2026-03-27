'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('question');
    if (!tableDesc.reason) {
      await queryInterface.addColumn('question', 'reason', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },
  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('question');
    if (tableDesc.reason) {
      await queryInterface.removeColumn('question', 'reason');
    }
  },
};
