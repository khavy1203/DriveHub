'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('teacher_course').catch(() => null);
    if (tableDesc) return;
    await queryInterface.createTable('teacher_course', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      teacherId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'user', key: 'id' },
        onDelete: 'CASCADE',
      },
      courseId: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: { model: 'khoahoc', key: 'IDKhoaHoc' },
        onDelete: 'CASCADE',
      },
      createdAt: { type: Sequelize.DATE },
      updatedAt: { type: Sequelize.DATE },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('teacher_course');
  },
};
