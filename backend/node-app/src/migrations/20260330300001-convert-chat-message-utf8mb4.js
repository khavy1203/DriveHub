'use strict';

/** Convert chat_message text columns to utf8mb4 so Vietnamese diacritics are stored correctly. */
module.exports = {
  async up(queryInterface) {
    const tableExists = await queryInterface.describeTable('chat_message').catch(() => null);
    if (!tableExists) return;

    // Set table default charset (does not touch existing columns)
    await queryInterface.sequelize.query(
      'ALTER TABLE `chat_message` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;',
    );

    // Convert only the body column (TEXT) — skip ENUM columns to avoid truncation
    await queryInterface.sequelize.query(
      'ALTER TABLE `chat_message` MODIFY `body` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;',
    );
  },

  async down(queryInterface) {
    const tableExists = await queryInterface.describeTable('chat_message').catch(() => null);
    if (!tableExists) return;

    await queryInterface.sequelize.query(
      'ALTER TABLE `chat_message` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE `chat_message` MODIFY `body` TEXT CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL;',
    );
  },
};
