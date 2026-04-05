'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('instructor_profile');
    if (!table.teachingVehicle) {
      await queryInterface.addColumn('instructor_profile', 'teachingVehicle', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('instructor_profile', 'teachingVehicle');
  },
};
