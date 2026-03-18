'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log("Thêm cột 'loaibangthi' vào bảng 'thisinh'");
      
      // Thêm cột 'loaibangthi' kiểu STRING vào bảng 'thisinh'
      const tableDesc = await queryInterface.describeTable('thisinh');
      if (!tableDesc.loaibangthi) {
        await queryInterface.addColumn('thisinh', 'loaibangthi', {
          type: Sequelize.STRING,
          allowNull: true,
        });
      }

      console.log("Thêm cột 'loaibangthi' thành công");
    } catch (error) {
      console.error("Lỗi khi thêm cột 'loaibangthi':", error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log("Xóa cột 'loaibangthi' khỏi bảng 'thisinh'");

      // Xóa cột 'loaibangthi' khỏi bảng 'thisinh'
      await queryInterface.removeColumn('thisinh', 'loaibangthi');

      console.log("Xóa cột 'loaibangthi' thành công");
    } catch (error) {
      console.error("Lỗi khi xóa cột 'loaibangthi':", error);
      throw error;
    }
  }
};
