'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('kqsh_subjects');
    if (table.LoaiSH && table.LoaiSH.type.includes('ENUM')) {
      await queryInterface.changeColumn('kqsh_subjects', 'LoaiSH', {
        type: Sequelize.STRING(10),
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('kqsh_subjects', 'LoaiSH', {
      type: Sequelize.ENUM('L', 'H', 'D', 'M'),
      allowNull: true,
    });
  },
};
