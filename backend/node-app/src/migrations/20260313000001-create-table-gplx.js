'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('gplx', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      ma_dang_ky: { type: Sequelize.STRING(100), allowNull: true },
      ho_ten: { type: Sequelize.STRING(200), allowNull: true },
      ngay_sinh: { type: Sequelize.DATEONLY, allowNull: true },
      so_cmnd_cccd: { type: Sequelize.STRING(30), allowNull: true },
      so_gplx: { type: Sequelize.STRING(30), allowNull: true },
      hang: { type: Sequelize.STRING(10), allowNull: true },
      ket_qua_xac_thuc: { type: Sequelize.STRING(50), allowNull: true },
      ly_do_tu_choi: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: true },
      updatedAt: { type: Sequelize.DATE, allowNull: true },
    });
    
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('gplx');
  },
};
