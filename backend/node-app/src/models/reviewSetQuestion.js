'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class reviewSetQuestion extends Model {
    static associate() {}
  }

  reviewSetQuestion.init(
    {
      id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      IDReviewSet: { type: DataTypes.INTEGER, allowNull: false },
      IDQuestion:  { type: DataTypes.INTEGER, allowNull: false },
      orderIndex:  { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      sequelize,
      modelName: 'reviewSetQuestion',
      tableName: 'review_set_question',
      timestamps: false,
    },
  );

  return reviewSetQuestion;
};
