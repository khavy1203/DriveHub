'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('student_assignment');
    if (tableDesc.courseId && !tableDesc.courseId.allowNull) {
      await queryInterface.changeColumn('student_assignment', 'courseId', {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('student_assignment', 'courseId', {
      type: Sequelize.STRING(20),
      allowNull: false,
    });
  },
};
