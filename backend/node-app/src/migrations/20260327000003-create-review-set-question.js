'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('review_set_question', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      IDReviewSet: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'review_set', key: 'id' },
        onDelete: 'CASCADE',
      },
      IDQuestion: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'question', key: 'id' },
        onDelete: 'CASCADE',
      },
      orderIndex: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    });

    await queryInterface.addIndex('review_set_question', ['IDReviewSet'], {
      name: 'idx_rsq_review_set',
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('review_set_question');
  },
};
