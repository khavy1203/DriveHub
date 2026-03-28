'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('student_assignment').catch(() => null);
    if (tableDesc) return;
    await queryInterface.createTable('student_assignment', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      studentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'thisinh', key: 'IDThiSinh' },
        onDelete: 'CASCADE',
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
      status: {
        type: Sequelize.ENUM('waiting', 'learning', 'completed'),
        allowNull: false,
        defaultValue: 'learning',
      },
      progressPercent: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: { type: Sequelize.DATE },
      updatedAt: { type: Sequelize.DATE },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('student_assignment');
  },
};
