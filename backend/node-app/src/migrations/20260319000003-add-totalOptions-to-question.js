'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('question', 'totalOptions', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 4,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('question', 'totalOptions');
  },
};
