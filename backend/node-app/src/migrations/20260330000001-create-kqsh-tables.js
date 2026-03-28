'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('kqsh_thisinh')) {
      await queryInterface.createTable('kqsh_thisinh', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        hocVienId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'hoc_vien', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        SoCCCD:       { type: Sequelize.STRING(20), allowNull: false },
        MaKySH:       { type: Sequelize.STRING(50), allowNull: false },
        SoBaoDanh:    { type: Sequelize.INTEGER, allowNull: false },
        HoVaTen:      { type: Sequelize.STRING(255), allowNull: true },
        NgaySinh:     { type: Sequelize.STRING(20), allowNull: true },
        HangGPLX:     { type: Sequelize.STRING(10), allowNull: true },
        MaKhoaHoc:    { type: Sequelize.STRING(50), allowNull: true },
        NgaySH:       { type: Sequelize.DATE, allowNull: true },
        KetQuaSH:     { type: Sequelize.STRING(10), allowNull: true },
        DiemLyThuyet: { type: Sequelize.FLOAT, allowNull: true },
        DiemHinh:     { type: Sequelize.FLOAT, allowNull: true },
        DiemDuong:    { type: Sequelize.FLOAT, allowNull: true },
        DiemMoPhong:  { type: Sequelize.FLOAT, allowNull: true },
        SoQDSH:       { type: Sequelize.STRING(100), allowNull: true },
        createdAt:    { type: Sequelize.DATE },
        updatedAt:    { type: Sequelize.DATE },
      });

      await queryInterface.addIndex('kqsh_thisinh', ['MaKySH', 'SoBaoDanh'], {
        unique: true,
        name: 'kqsh_thisinh_maksh_sbd_unique',
      });
      await queryInterface.addIndex('kqsh_thisinh', ['SoCCCD'], {
        name: 'kqsh_thisinh_cccd_idx',
      });
    }

    if (!tables.includes('kqsh_subjects')) {
      await queryInterface.createTable('kqsh_subjects', {
        id:           { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        thisinhId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'kqsh_thisinh', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        MaKySH:       { type: Sequelize.STRING(50), allowNull: false },
        SoBaoDanh:    { type: Sequelize.INTEGER, allowNull: false },
        LoaiSH:       { type: Sequelize.ENUM('L', 'H', 'D'), allowNull: true },
        NgaySH:       { type: Sequelize.DATE, allowNull: true },
        DiemSH:       { type: Sequelize.FLOAT, allowNull: true },
        DiemToiDa:    { type: Sequelize.FLOAT, allowNull: true },
        DiemToiThieu: { type: Sequelize.FLOAT, allowNull: true },
        VangSH:       { type: Sequelize.TINYINT, allowNull: true },
        KetQuaSH:     { type: Sequelize.STRING(10), allowNull: true },
        createdAt:    { type: Sequelize.DATE },
        updatedAt:    { type: Sequelize.DATE },
      });

      await queryInterface.addIndex('kqsh_subjects', ['MaKySH', 'SoBaoDanh', 'LoaiSH'], {
        unique: true,
        name: 'kqsh_subjects_maksh_sbd_loai_unique',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('kqsh_subjects');
    await queryInterface.dropTable('kqsh_thisinh');
  },
};
