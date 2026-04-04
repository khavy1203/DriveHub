'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const desc = await queryInterface.describeTable('user');
    if (!desc.featuredOnHomepage) {
      await queryInterface.addColumn('user', 'featuredOnHomepage', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    const desc = await queryInterface.describeTable('user');
    if (desc.featuredOnHomepage) {
      await queryInterface.removeColumn('user', 'featuredOnHomepage');
    }
  },
};
