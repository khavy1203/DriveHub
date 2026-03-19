'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('thisinh');
    // Chỉ đổi nếu cột chưa phải MEDIUMBLOB / LONGBLOB
    if (table.Anh && !['MEDIUMBLOB', 'LONGBLOB', 'BLOB'].includes(table.Anh.type)) {
      await queryInterface.changeColumn('thisinh', 'Anh', {
        type: Sequelize.BLOB('medium'),
        allowNull: true,
      });
      console.log("Đã đổi cột 'Anh' sang MEDIUMBLOB");
    } else {
      console.log("Cột 'Anh' đã là BLOB/MEDIUMBLOB, bỏ qua.");
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('thisinh', 'Anh', {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
    });
  },
};
