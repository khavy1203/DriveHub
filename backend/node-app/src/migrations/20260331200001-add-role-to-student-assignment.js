'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const desc = await queryInterface.describeTable('student_assignment');
    if (!desc.role) {
      await queryInterface.addColumn('student_assignment', 'role', {
        type: Sequelize.ENUM('primary', 'supervisor'),
        allowNull: false,
        defaultValue: 'primary',
      });
    }
  },

  async down(queryInterface) {
    const desc = await queryInterface.describeTable('student_assignment');
    if (desc.role) {
      await queryInterface.removeColumn('student_assignment', 'role');
    }
  },
};
