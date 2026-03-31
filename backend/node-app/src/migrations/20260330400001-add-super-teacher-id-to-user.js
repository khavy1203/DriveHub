'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('user');
    if (!table.superTeacherId) {
      await queryInterface.addColumn('user', 'superTeacherId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: { model: 'user', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        after: 'thisinhId',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('user');
    if (table.superTeacherId) {
      await queryInterface.removeColumn('user', 'superTeacherId');
    }
  },
};
