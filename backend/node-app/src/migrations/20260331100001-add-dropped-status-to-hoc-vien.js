'use strict';

module.exports = {
  async up(queryInterface) {
    const tableDesc = await queryInterface.describeTable('hoc_vien');
    const currentType = tableDesc.status?.type || '';

    if (!currentType.includes('dropped')) {
      await queryInterface.sequelize.query(
        "ALTER TABLE `hoc_vien` MODIFY COLUMN `status` ENUM('registered','assigned','learning','dat_completed','exam_ready','dropped') NOT NULL DEFAULT 'registered'"
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "ALTER TABLE `hoc_vien` MODIFY COLUMN `status` ENUM('registered','assigned','learning','dat_completed','exam_ready') NOT NULL DEFAULT 'registered'"
    );
  },
};
