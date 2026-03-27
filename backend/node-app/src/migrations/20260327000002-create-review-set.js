'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('review_set', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      IDRank: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'rank', key: 'id' },
        onDelete: 'CASCADE',
      },
      setIndex: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Display order within the rank (1, 2, 3...)',
      },
      totalQuestions: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: { type: Sequelize.DATE },
      updatedAt: { type: Sequelize.DATE },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('review_set');
  },
};
