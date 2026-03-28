'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Định nghĩa quan hệ với bảng group
      user.belongsTo(models.group, {
        foreignKey: 'groupId',
        // onDelete: 'CASCADE',
        // onUpdate: 'CASCADE',
      });
      user.belongsToMany(models.khoahoc, {
        through: models.teacher_course,
        foreignKey: 'teacherId',
        otherKey: 'courseId',
        as: 'assignedCourses',
      });
      user.hasOne(models.teacher_profile, {
        foreignKey: 'userId',
        as: 'teacherProfile',
      });
    }
  }

  user.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true, // Thiết lập tự động tăng
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Email phải là duy nhất
        validate: {
          isEmail: true, // Xác thực định dạng email
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isNumeric: true, // Chỉ cho phép số
        },
      },
      image: {
        type: DataTypes.BLOB('long'),
        allowNull: true,
      },
      genderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      groupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      googleId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      githubId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      facebookId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      active: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1, // Mặc định là active
      },
      thisinhId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      setupToken: {
        type: DataTypes.STRING(64),
        allowNull: true,
        defaultValue: null,
      },
      setupTokenExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName: 'user',
      tableName: 'user', // Tên bảng
      timestamps: true, // Sử dụng cột createdAt và updatedAt
    }
  );

  return user;
};
