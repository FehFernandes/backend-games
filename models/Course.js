const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Course = sequelize.define("Course", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  level: {
    type: DataTypes.ENUM("fundamental", "medio", "superior", "pos-graduacao"),
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER, // em meses
    allowNull: false,
  },
  workload: {
    type: DataTypes.INTEGER, // em horas
    allowNull: false,
  },
  maxStudents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("ativo", "inativo", "em-planejamento"),
    defaultValue: "ativo",
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  schedule: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  classroom: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  prerequisites: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  objectives: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "Teachers",
      key: "id",
    },
  },
});

module.exports = Course;
