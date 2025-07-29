const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const bcrypt = require("bcrypt");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 30],
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 255],
        notEmpty: true,
      },
    },
  },
  {
    tableName: "users",
    hooks: {
      // Hash da senha antes de salvar
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
  }
);

// Método para verificar senha
User.prototype.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Método para buscar usuário por username ou email
User.findByLogin = async function (login) {
  return await this.findOne({
    where: {
      [sequelize.Sequelize.Op.or]: [{ username: login }, { email: login }],
    },
  });
};

module.exports = User;
