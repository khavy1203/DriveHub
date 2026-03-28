'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('chat_message');
    if (!table.deliveredAt) {
      await queryInterface.addColumn('chat_message', 'deliveredAt', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('chat_message', 'deliveredAt');
  },
};
