'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('teacher_rating')) return;
    await queryInterface.createTable('teacher_rating', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      teacherUserId: { type: Sequelize.INTEGER, allowNull: false },
      hocVienId: { type: Sequelize.INTEGER, allowNull: false },
      stars: { type: Sequelize.INTEGER, allowNull: false },
      comment: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('teacher_rating', ['teacherUserId', 'hocVienId'], {
      unique: true,
      name: 'uq_teacher_hocvien_rating',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('teacher_rating');
  },
};
