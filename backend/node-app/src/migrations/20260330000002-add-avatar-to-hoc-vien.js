'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('hoc_vien');
    if (!table.avatarUrl) {
      await queryInterface.addColumn('hoc_vien', 'avatarUrl', {
        type: Sequelize.STRING(512),
        allowNull: true,
        defaultValue: null,
        after: 'GhiChu',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('hoc_vien', 'avatarUrl');
  },
};
