'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tApi = await queryInterface.describeTable('api_endpoint').catch(() => null);
    if (!tApi) {
      await queryInterface.createTable('api_endpoint', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        method: {
          type: Sequelize.ENUM('GET', 'POST', 'PUT', 'DELETE', 'ALL'),
          allowNull: false,
        },
        path: {
          type: Sequelize.STRING(191),
          allowNull: false,
        },
        pattern: {
          type: Sequelize.STRING(191),
          allowNull: true,
        },
        featureGroup: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        description: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        isPublic: {
          type: Sequelize.TINYINT(1),
          allowNull: false,
          defaultValue: 0,
        },
        isActive: {
          type: Sequelize.TINYINT(1),
          allowNull: false,
          defaultValue: 1,
        },
        sortOrder: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });
      await queryInterface.addConstraint('api_endpoint', {
        fields: ['method', 'path'],
        type: 'unique',
        name: 'uq_api_endpoint_method_path',
      });
    }

    const tGa = await queryInterface.describeTable('group_api').catch(() => null);
    if (!tGa) {
      await queryInterface.createTable('group_api', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        groupId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'group', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        apiEndpointId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'api_endpoint', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });
      await queryInterface.addConstraint('group_api', {
        fields: ['groupId', 'apiEndpointId'],
        type: 'unique',
        name: 'uq_group_api_group_endpoint',
      });
    }
  },

  async down(queryInterface) {
    const tGa = await queryInterface.describeTable('group_api').catch(() => null);
    if (tGa) {
      await queryInterface.removeConstraint('group_api', 'uq_group_api_group_endpoint').catch(() => {});
      await queryInterface.dropTable('group_api');
    }
    const tApi = await queryInterface.describeTable('api_endpoint').catch(() => null);
    if (tApi) {
      await queryInterface.removeConstraint('api_endpoint', 'uq_api_endpoint_method_path').catch(() => {});
      await queryInterface.dropTable('api_endpoint');
    }
  },
};
