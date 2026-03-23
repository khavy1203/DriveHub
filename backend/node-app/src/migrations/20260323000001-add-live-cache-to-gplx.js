'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('gplx');

    if (!tableDesc.live_moto) {
      await queryInterface.addColumn('gplx', 'live_moto', { type: Sequelize.TEXT, allowNull: true });
    }
    if (!tableDesc.live_oto) {
      await queryInterface.addColumn('gplx', 'live_oto', { type: Sequelize.TEXT, allowNull: true });
    }
    if (!tableDesc.live_cached_at) {
      await queryInterface.addColumn('gplx', 'live_cached_at', { type: Sequelize.DATE, allowNull: true });
    }
  },
  down: async (queryInterface) => {
    const tableDesc = await queryInterface.describeTable('gplx');

    if (tableDesc.live_moto)      await queryInterface.removeColumn('gplx', 'live_moto');
    if (tableDesc.live_oto)       await queryInterface.removeColumn('gplx', 'live_oto');
    if (tableDesc.live_cached_at) await queryInterface.removeColumn('gplx', 'live_cached_at');
  }
};
