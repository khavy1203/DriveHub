'use strict';

// Roles for each group
// checkUserPermission logic: canAccess = roles.some(r => r.url === path || path.includes(r.url))
// url='/' matches everything (all paths include '/')
const ROLES = [
  { id: 1, url: '/',                    description: 'Toàn quyền truy cập hệ thống' },
  { id: 2, url: '/student-assignment',  description: 'Cập nhật tiến độ học viên' },
  { id: 3, url: '/hocvien',             description: 'Xem danh sách học viên' },
];

// group_role mapping: groupId → roleIds[]
const GROUP_ROLES = [
  { groupId: 1, roleId: 1 }, // SupperAdmin → full access
  { groupId: 2, roleId: 1 }, // Admin → full access
  { groupId: 3, roleId: 2 }, // GiaoVien → student-assignment
  { groupId: 3, roleId: 3 }, // GiaoVien → hocvien (read)
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1. Fix group id=3 name (was 'User', should be 'GiaoVien')
    await queryInterface.sequelize.query(
      "UPDATE `group` SET name = 'GiaoVien', updatedAt = ? WHERE id = 3 AND name != 'GiaoVien'",
      { replacements: [now], type: Sequelize.QueryTypes.UPDATE }
    );

    // 2. Seed roles (idempotent)
    const [existingRoleRows] = await queryInterface.sequelize.query('SELECT id FROM `role`');
    const existingRoleIds = new Set(existingRoleRows.map(r => r.id));
    const rolesToInsert = ROLES
      .filter(r => !existingRoleIds.has(r.id))
      .map(r => ({ ...r, createdAt: now, updatedAt: now }));

    if (rolesToInsert.length > 0) {
      await queryInterface.bulkInsert('role', rolesToInsert);
    }

    // 3. Seed group_role (idempotent)
    const [existingGRRows] = await queryInterface.sequelize.query('SELECT groupId, roleId FROM `group_role`');
    const existingGRSet = new Set(existingGRRows.map(r => `${r.groupId}-${r.roleId}`));
    const grToInsert = GROUP_ROLES
      .filter(r => !existingGRSet.has(`${r.groupId}-${r.roleId}`))
      .map(r => ({ ...r, createdAt: now, updatedAt: now }));

    if (grToInsert.length > 0) {
      await queryInterface.bulkInsert('group_role', grToInsert);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "UPDATE `group` SET name = 'User' WHERE id = 3"
    );
    await queryInterface.bulkDelete('group_role', { groupId: [1, 2, 3] });
    await queryInterface.bulkDelete('role', { id: [1, 2, 3] });
  },
};
