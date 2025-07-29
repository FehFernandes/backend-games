const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Student = sequelize.define("Student", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  document: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  registration: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  birthDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  emergencyContact: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  emergencyPhone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  enrollmentDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM("ativo", "inativo", "trancado", "formado"),
    defaultValue: "ativo",
  },
  academicLevel: {
    type: DataTypes.ENUM("fundamental", "medio", "superior", "pos-graduacao"),
    allowNull: false,
  },
});

module.exports = Student;
