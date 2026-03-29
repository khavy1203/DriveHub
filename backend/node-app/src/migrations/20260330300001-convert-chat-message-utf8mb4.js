'use strict';

/** Convert chat_message table + body column to utf8mb4 so Vietnamese diacritics are stored correctly. */
module.exports = {
  async up(queryInterface) {
    const tableExists = await queryInterface.describeTable('chat_message').catch(() => null);
    if (!tableExists) return;

    await queryInterface.sequelize.query(
      'ALTER TABLE `chat_message` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;',
    );
  },

  async down(queryInterface) {
    const tableExists = await queryInterface.describeTable('chat_message').catch(() => null);
    if (!tableExists) return;

    await queryInterface.sequelize.query(
      'ALTER TABLE `chat_message` CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;',
    );
  },
};
