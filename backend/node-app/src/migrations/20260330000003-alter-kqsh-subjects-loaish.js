'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    let table;
    try {
      table = await queryInterface.describeTable('kqsh_subjects');
    } catch {
      return;
    }
    if (table.LoaiSH && String(table.LoaiSH.type).includes('ENUM')) {
      await queryInterface.changeColumn('kqsh_subjects', 'LoaiSH', {
        type: Sequelize.STRING(10),
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    let table;
    try {
      table = await queryInterface.describeTable('kqsh_subjects');
    } catch {
      return;
    }
    if (table.LoaiSH) {
      await queryInterface.changeColumn('kqsh_subjects', 'LoaiSH', {
        type: Sequelize.ENUM('L', 'H', 'D', 'M'),
        allowNull: true,
      });
    }
  },
};
