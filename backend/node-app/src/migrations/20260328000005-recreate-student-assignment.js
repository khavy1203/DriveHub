'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop old table (used studentId → thisinh, wrong FK)
    const tables = await queryInterface.showAllTables();
    if (tables.includes('student_assignment')) {
      await queryInterface.dropTable('student_assignment');
    }

    await queryInterface.createTable('student_assignment', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      hocVienId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'hoc_vien', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      teacherId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'user', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      courseId: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: { model: 'khoahoc', key: 'IDKhoaHoc' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('waiting', 'learning', 'completed'),
        allowNull: false,
        defaultValue: 'waiting',
      },
      progressPercent: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      datHoursCompleted: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      notes: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE },
      updatedAt: { type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('student_assignment');
  },
};
