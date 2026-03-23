'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('gplx', 'live_moto', { type: Sequelize.TEXT, allowNull: true });
    await queryInterface.addColumn('gplx', 'live_oto',  { type: Sequelize.TEXT, allowNull: true });
    await queryInterface.addColumn('gplx', 'live_cached_at', { type: Sequelize.DATE, allowNull: true });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('gplx', 'live_moto');
    await queryInterface.removeColumn('gplx', 'live_oto');
    await queryInterface.removeColumn('gplx', 'live_cached_at');
  }
};
