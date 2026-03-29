'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class group extends Model {

        static associate(models) {
            // Định nghĩa quan hệ một-nhiều với bảng user
            group.hasMany(models.user, {
                foreignKey: "groupId",
            });
            group.belongsToMany(models.role, {
                through: "group_role",
                foreignKey: "groupId",
            });
            group.belongsToMany(models.api_endpoint, {
                through: models.group_api,
                foreignKey: 'groupId',
                otherKey: 'apiEndpointId',
                as: 'apiEndpoints',
            });
        }
    }

    // Khởi tạo model
    group.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            description: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'group', // Tên model
            tableName: 'group', // Tên bảng
            timestamps: false, // Không sử dụng cột createdAt và updatedAt
        }
    );

    return group;
};
