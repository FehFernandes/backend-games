const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Genre = sequelize.define(
  "Genre",
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "genres",
    indexes: [
      {
        unique: true,
        fields: ["name"],
      },
    ],
  }
);

module.exports = Genre; 