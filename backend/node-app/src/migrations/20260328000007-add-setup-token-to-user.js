'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = await queryInterface.describeTable('user');
    if (!cols.setupToken) {
      await queryInterface.addColumn('user', 'setupToken', {
        type: Sequelize.STRING(64),
        allowNull: true,
        defaultValue: null,
        unique: true,
      });
    }
    if (!cols.setupTokenExpiry) {
      await queryInterface.addColumn('user', 'setupTokenExpiry', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface) {
    const cols = await queryInterface.describeTable('user');
    if (cols.setupToken) await queryInterface.removeColumn('user', 'setupToken');
    if (cols.setupTokenExpiry) await queryInterface.removeColumn('user', 'setupTokenExpiry');
  },
};
