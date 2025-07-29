const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Game = sequelize.define(
  "Game",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 10.0,
      },
    },
    releaseDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    developer: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 100],
      },
    },
    publisher: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 100],
      },
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    genreId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "genres",
        key: "id",
      },
    },
    platformId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "platforms",
        key: "id",
      },
    },
  },
  {
    tableName: "games",
    indexes: [
      {
        fields: ["genreId"],
      },
      {
        fields: ["platformId"],
      },
      {
        fields: ["rating"],
      },
    ],
  }
);

module.exports = Game; 