const { Sequelize } = require("sequelize");
const path = require("path");


const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "..", "database.sqlite"),
  logging: false, 
  define: {
    timestamps: true, 
    underscored: false, 
  },
});

// Testar conexão
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com SQLite estabelecida com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao conectar com o banco de dados:", error);
  }
}

module.exports = { sequelize, testConnection };
