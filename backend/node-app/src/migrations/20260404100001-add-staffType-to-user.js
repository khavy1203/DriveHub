'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const desc = await queryInterface.describeTable('user');
    if (!desc.staffType) {
      await queryInterface.addColumn('user', 'staffType', {
        type: Sequelize.ENUM('official', 'auxiliary'),
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface) {
    const desc = await queryInterface.describeTable('user');
    if (desc.staffType) {
      await queryInterface.removeColumn('user', 'staffType');
    }
  },
};
