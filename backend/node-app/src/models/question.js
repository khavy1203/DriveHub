'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class question extends Model {
    static associate(models) {
      question.belongsToMany(models.test, {
        through: 'test_question',
        foreignKey: 'IDQuestion',
        otherKey: 'IDTest',
        as: 'tests',
      });
      question.belongsToMany(models.reviewSet, {
        through: 'review_set_question',
        foreignKey: 'IDQuestion',
        otherKey: 'IDReviewSet',
        as: 'reviewSets',
      });
    }
  }

  question.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    number: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    URLImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    answer: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    totalOptions: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 4,
    },
    tip: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'question',
    tableName: 'question',
    timestamps: true,
  });

  return question;
};
