'use strict';
const { Model } = require('sequelize');
const fs = require('fs');
const path = require('path');

module.exports = (sequelize, DataTypes) => {
  // Khai báo lớp thisinh trước khi sử dụng thisinh.init
  class thisinh extends Model {
    static associate(models) {
      // Thiết lập quan hệ 1-1 với bảng khoahoc_thisinh
      thisinh.hasOne(models.khoahoc_thisinh, {
        foreignKey: 'IDThiSinh',
      });

      // Quan hệ belongsTo với processtest
      thisinh.belongsTo(models.processtest, {
        foreignKey: 'IDprocesstest',
      });

      // Quan hệ hasMany với exam
      thisinh.hasMany(models.exam, {
        foreignKey: 'IDThisinh', // Đây là khóa ngoại trong bảng exam
        sourceKey: 'IDThiSinh',  // Đây là khóa chính trong bảng thisinh
      });

      thisinh.belongsTo(models.rank,{
        foreignKey:'loaibangthi',
        targetKey:'name'
      })

      thisinh.belongsTo(models.khoahoc,{
        foreignKey:'IDKhoaHoc',
        targetKey:'IDKhoaHoc'
      })

      // student_assignment now belongs to hoc_vien, not thisinh
    }

    // Hàm trả về Base64 khi truy xuất dữ liệu
    getAnhBase64() {
      const anhPath = this.getDataValue('Anh');
      if (anhPath) {
        // Đọc tệp hình ảnh và chuyển nó thành Base64 (Giả sử bạn có đường dẫn hợp lệ)
        const imagePath = path.join(__dirname, '../', anhPath); // Đảm bảo đường dẫn đúng
        const imageBuffer = fs.readFileSync(imagePath);
        return imageBuffer.toString('base64');
      }
      return null;
    }

  }

  // Định nghĩa bảng thisinh
  thisinh.init({
    IDThiSinh: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    IDKhoaHoc: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    Ma_Dang_Ky: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Ma_Ky_SH: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    HoTen: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    GioiTinh: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    SoCMT: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    NgaySinh: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    QuocTich: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    DiaChi: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    SucKhoe: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    VanHoa: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    GplxDaCo: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ThamNien: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    SoKm: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    GhiChu: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    Anh: {
      type: DataTypes.BLOB('medium'),
      allowNull: true,
      get() {
        try {
          const anhValue = this.getDataValue('Anh');
          if (!anhValue) return "";

          // BLOB column → Sequelize trả Buffer
          if (Buffer.isBuffer(anhValue) && anhValue.length > 0) {
            const firstByte = anhValue[0];
            // Magic bytes: JPEG=0xFF, PNG=0x89, binary JP2=0x00
            // Nếu là binary image → chuyển sang base64
            if (firstByte === 0xFF || firstByte === 0x89 || firstByte === 0x00) {
              return anhValue.toString('base64');
            }
            // Không phải binary → là chuỗi base64 lưu dưới dạng UTF-8 bytes (data cũ)
            return anhValue.toString('utf8');
          }

          // String → có thể là file path hoặc base64 cũ
          const anhStr = String(anhValue);
          const looksLikePath = anhStr.length < 500 && (
            anhStr.includes('/') || anhStr.includes('\\') ||
            /\.(jpg|jpeg|png|gif|webp)$/i.test(anhStr)
          );
          if (looksLikePath) {
            const imagePath = path.join(__dirname, '../', anhStr);
            if (fs.existsSync(imagePath)) {
              return fs.readFileSync(imagePath).toString('base64');
            }
            return "";
          }

          return anhStr;
        } catch (error) {
          console.error('Lỗi khi xử lý file ảnh:', error.message);
          return "";
        }
      }
    },
    DuongDanAnh: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    noidungSH: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    loaibangthi: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    IDprocesstest: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    print: {
      type: DataTypes.BOOLEAN,
      defaultValue: 1,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: 'thisinh',
    tableName: 'thisinh',
    timestamps: false,
  });

  return thisinh;
};
