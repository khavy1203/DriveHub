'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const desc = await queryInterface.describeTable('hoc_vien');
    if (!desc.superTeacherId) {
      await queryInterface.addColumn('hoc_vien', 'superTeacherId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: { model: 'user', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface) {
    const desc = await queryInterface.describeTable('hoc_vien');
    if (desc.superTeacherId) {
      await queryInterface.removeColumn('hoc_vien', 'superTeacherId');
    }
  },
};
