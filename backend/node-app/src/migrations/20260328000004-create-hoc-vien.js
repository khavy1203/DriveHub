'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('hoc_vien')) return;

    await queryInterface.createTable('hoc_vien', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      HoTen: { type: Sequelize.STRING(255), allowNull: false },
      NgaySinh: { type: Sequelize.DATEONLY, allowNull: true },
      GioiTinh: { type: Sequelize.STRING(10), allowNull: true },
      SoCCCD: { type: Sequelize.STRING(20), allowNull: true },
      phone: { type: Sequelize.STRING(20), allowNull: true },
      email: { type: Sequelize.STRING(255), allowNull: true },
      DiaChi: { type: Sequelize.STRING(255), allowNull: true },
      loaibangthi: { type: Sequelize.STRING(20), allowNull: true },
      GplxDaCo: { type: Sequelize.STRING(100), allowNull: true },
      GhiChu: { type: Sequelize.TEXT, allowNull: true },
      IDKhoaHoc: {
        type: Sequelize.STRING(20),
        allowNull: true,
        references: { model: 'khoahoc', key: 'IDKhoaHoc' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'user', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('registered', 'assigned', 'learning', 'dat_completed', 'exam_ready'),
        allowNull: false,
        defaultValue: 'registered',
      },
      createdAt: { type: Sequelize.DATE },
      updatedAt: { type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('hoc_vien');
  },
};
