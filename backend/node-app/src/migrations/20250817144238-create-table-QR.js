'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Với Postgres, nên đảm bảo enum cũ (nếu có) được drop trước khi tạo lại
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_QR_type";');
    }

    await queryInterface.createTable('QR', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },

      // Khóa ngoại tới Courses.id
      courseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'CourseQR',   // bảng Courses (plural)
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      // Nội dung QR (chuỗi đã decode hoặc raw payload)
      code: {
        type: Sequelize.STRING(1024),
        allowNull: false,
      },

      // Mô tả thêm cho QR
      description: {
        type: Sequelize.STRING(1024),
        allowNull: true,
      },

      // Loại QR (ENUM)
      type: {
        type: Sequelize.ENUM(
          'CCCD',
          'GPLX',
          'BANK_VIETQR',
          'BILL_QR',
          'E_GOV',
          'HEALTH_QR',
          'E_TICKET',
          'WAYBILL',
          'PRODUCT_QR',
          'VOUCHER',
          'OTHER'
        ),
        allowNull: false,
        defaultValue: 'CCCD',
        comment: 'Phân loại QR theo nghiệp vụ: CCCD/GPLX/Thanh toán/Hoá đơn/DVC/Y tế/Vé/Vận đơn/Sản phẩm/Voucher/Khác',
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex('QR', ['type']);
  },

  async down(queryInterface, Sequelize) {
    // Xóa bảng trước
    await queryInterface.dropTable('QR');

    // Với Postgres: xóa type ENUM thủ công để tránh tồn đọng
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_QR_type";');
    }
  },
};
