'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Clean up fake placeholder emails first (before adding unique constraint)
    await queryInterface.sequelize.query(
      `UPDATE \`user\` SET email = NULL WHERE email LIKE '%@drivehub.local' OR email LIKE '%@placeholder.local'`
    );

    // 2. Shrink to VARCHAR(191) so unique index fits within 767-byte key limit (191 × 4 = 764)
    await queryInterface.changeColumn('user', 'email', {
      type: Sequelize.STRING(191),
      allowNull: true,
    });

    // 3. Add unique index separately
    await queryInterface.addIndex('user', ['email'], {
      unique: true,
      name: 'user_email_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('user', 'user_email_unique');
    await queryInterface.changeColumn('user', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
