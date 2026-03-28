'use strict';

const GROUPS = [
  { id: 1, name: 'SupperAdmin', description: 'Quản lý hệ thống toàn quyền' },
  { id: 2, name: 'Admin', description: 'Quản trị viên' },
  { id: 3, name: 'GiaoVien', description: 'Giáo viên đào tạo' },
  { id: 4, name: 'HocVien', description: 'Học viên đào tạo' },
  { id: 5, name: 'KhachHang', description: 'Khách hàng tự đăng ký' },
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      'SELECT id FROM `group`',
      { type: Sequelize.QueryTypes.SELECT },
    );
    const existingIds = new Set(existing.map(r => r.id));
    const now = new Date();
    const toInsert = GROUPS
      .filter(g => !existingIds.has(g.id))
      .map(g => ({ ...g, createdAt: now, updatedAt: now }));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('group', toInsert);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('group', { id: [3, 4, 5] });
  },
};
