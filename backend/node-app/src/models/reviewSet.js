'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class reviewSet extends Model {
    static associate(models) {
      reviewSet.belongsTo(models.rank, { foreignKey: 'IDRank', as: 'rank' });
      reviewSet.belongsToMany(models.question, {
        through: 'review_set_question',
        foreignKey: 'IDReviewSet',
        otherKey: 'IDQuestion',
        as: 'questions',
      });
    }
  }

  reviewSet.init(
    {
      id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name:           { type: DataTypes.STRING(100), allowNull: false },
      IDRank:         { type: DataTypes.INTEGER, allowNull: false },
      setIndex:       { type: DataTypes.INTEGER, allowNull: false },
      totalQuestions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      sequelize,
      modelName: 'reviewSet',
      tableName: 'review_set',
      timestamps: true,
    },
  );

  return reviewSet;
};
