const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Platform = sequelize.define(
  "Platform",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 50],
        notEmpty: true,
      },
    },
    manufacturer: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 50],
      },
    },
    releaseYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1970,
        max: new Date().getFullYear() + 5,
      },
    },
  },
  {
    tableName: "platforms",
    indexes: [
      {
        unique: true,
        fields: ["name"],
      },
    ],
  }
);

module.exports = Platform; 