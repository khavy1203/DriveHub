'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class question extends Model {
    static associate(models) {
      // Quan hệ nhiều-nhiều với test qua bảng trung gian test_question
      question.belongsToMany(models.test, {
        through: 'test_question',
        foreignKey: 'IDQuestion',
        otherKey: 'IDTest',
        as: 'tests',
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
  }, {
    sequelize,
    modelName: 'question',
    tableName: 'question',
    timestamps: true,
  });

  return question;
};
