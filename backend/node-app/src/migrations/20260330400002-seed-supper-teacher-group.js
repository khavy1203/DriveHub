'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      'SELECT id FROM `group` WHERE id = 6',
      { type: Sequelize.QueryTypes.SELECT },
    );
    if (existing.length === 0) {
      const now = new Date();
      await queryInterface.bulkInsert('group', [{
        id: 6,
        name: 'SupperTeacher',
        description: 'Quản lý nhóm giáo viên',
        createdAt: now,
        updatedAt: now,
      }]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('group', { id: 6 });
  },
};
