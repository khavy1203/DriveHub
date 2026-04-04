'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      "ALTER TABLE `notification` MODIFY COLUMN `type` ENUM('admin_to_st','admin_to_student','superadmin_to_admin','superadmin_to_student') NOT NULL"
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "ALTER TABLE `notification` MODIFY COLUMN `type` ENUM('admin_to_st','admin_to_student') NOT NULL"
    );
  },
};
