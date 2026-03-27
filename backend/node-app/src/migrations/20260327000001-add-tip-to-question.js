'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('question');
    if (!tableDesc.tip) {
      await queryInterface.addColumn('question', 'tip', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },
  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('question');
    if (tableDesc.tip) {
      await queryInterface.removeColumn('question', 'tip');
    }
  },
};
