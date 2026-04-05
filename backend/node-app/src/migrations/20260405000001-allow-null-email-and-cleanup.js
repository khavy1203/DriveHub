'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Make email nullable
    await queryInterface.changeColumn('user', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    // 2. Set fake placeholder emails to NULL
    await queryInterface.sequelize.query(
      `UPDATE \`user\` SET email = NULL WHERE email LIKE '%@drivehub.local' OR email LIKE '%@placeholder.local'`
    );
  },

  async down(queryInterface, Sequelize) {
    // Restore fake emails for users that have NULL email (best-effort)
    // Can't perfectly reverse but set NOT NULL back
    await queryInterface.changeColumn('user', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  },
};
