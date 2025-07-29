const { sequelize } = require("../config/database");

// Importar modelos
const User = require("./User");
const Game = require("./Game");
const Genre = require("./Genre");
const Platform = require("./Platform");

// Definir relacionamentos
// Genre -> Games (Um para muitos)
Genre.hasMany(Game, {
  foreignKey: "genreId",
  as: "games",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Game.belongsTo(Genre, {
  foreignKey: "genreId",
  as: "genre",
});

// Platform -> Games (Um para muitos)
Platform.hasMany(Game, {
  foreignKey: "platformId", 
  as: "games",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Game.belongsTo(Platform, {
  foreignKey: "platformId",
  as: "platform",
});

// Sincronizar banco de dados
async function syncDatabase() {
  try {
    // Sincronizar modelos na ordem correta (dependências primeiro)
    await sequelize.sync({ alter: true });
    console.log("✅ Database synchronized successfully!");
  } catch (error) {
    console.error("❌ Error synchronizing database:", error);
    throw error;
  }
}

// Criar dados de exemplo
async function createSampleData() {
  try {
    // Verificar se já existem dados
    const userCount = await User.count();
    const genreCount = await Genre.count();
    const platformCount = await Platform.count();
    
    if (userCount > 0 && genreCount > 0 && platformCount > 0) {
      console.log("📊 Sample data already exists, skipping creation...");
      return;
    }

    console.log("🌱 Creating sample data...");

    // Criar usuário admin se não existir
    if (userCount === 0) {
      await User.create({
        username: "admin",
        email: "admin@games.com",
        password: "admin123",
      });
      console.log("👤 Admin user created: admin@games.com / admin123");
    }

    // Criar gêneros de exemplo
    if (genreCount === 0) {
      const genres = [
        { name: "Action", description: "High-energy games with combat and challenges" },
        { name: "Adventure", description: "Story-driven exploration games" },
        { name: "RPG", description: "Role-playing games with character development" },
        { name: "Strategy", description: "Strategic thinking and planning games" },
        { name: "Shooter", description: "First or third-person shooting games" },
        { name: "Sports", description: "Athletic and competitive sports games" },
        { name: "Racing", description: "Vehicle racing and driving games" },
        { name: "Puzzle", description: "Logic and problem-solving games" },
        { name: "Platform", description: "Jump and run platform games" },
        { name: "Fighting", description: "Combat and martial arts games" },
      ];

      await Genre.bulkCreate(genres);
      console.log("🎮 Sample genres created");
    }

    // Criar plataformas de exemplo
    if (platformCount === 0) {
      const platforms = [
        { name: "PlayStation 5", manufacturer: "Sony", releaseYear: 2020 },
        { name: "Xbox Series X", manufacturer: "Microsoft", releaseYear: 2020 },
        { name: "Nintendo Switch", manufacturer: "Nintendo", releaseYear: 2017 },
        { name: "PC", manufacturer: "Various", releaseYear: null },
        { name: "PlayStation 4", manufacturer: "Sony", releaseYear: 2013 },
        { name: "Xbox One", manufacturer: "Microsoft", releaseYear: 2013 },
        { name: "Steam Deck", manufacturer: "Valve", releaseYear: 2022 },
        { name: "Mobile", manufacturer: "Various", releaseYear: null },
      ];

      await Platform.bulkCreate(platforms);
      console.log("🎯 Sample platforms created");
    }

    // Criar jogos de exemplo
    const gameCount = await Game.count();
    if (gameCount === 0) {
      const actionGenre = await Genre.findOne({ where: { name: "Action" } });
      const rpgGenre = await Genre.findOne({ where: { name: "RPG" } });
      const adventureGenre = await Genre.findOne({ where: { name: "Adventure" } });
      
      const ps5Platform = await Platform.findOne({ where: { name: "PlayStation 5" } });
      const pcPlatform = await Platform.findOne({ where: { name: "PC" } });
      const switchPlatform = await Platform.findOne({ where: { name: "Nintendo Switch" } });

      const games = [
        {
          name: "The Legend of Zelda: Breath of the Wild",
          description: "Open-world adventure game set in Hyrule",
          rating: 9.7,
          releaseDate: "2017-03-03",
          developer: "Nintendo",
          publisher: "Nintendo",
          genreId: adventureGenre.id,
          platformId: switchPlatform.id,
        },
        {
          name: "Cyberpunk 2077",
          description: "Futuristic open-world RPG in Night City",
          rating: 8.2,
          releaseDate: "2020-12-10",
          developer: "CD Projekt Red",
          publisher: "CD Projekt",
          genreId: rpgGenre.id,
          platformId: pcPlatform.id,
        },
        {
          name: "Spider-Man: Miles Morales",
          description: "Superhero action-adventure game",
          rating: 8.5,
          releaseDate: "2020-11-12",
          developer: "Insomniac Games",
          publisher: "Sony Interactive Entertainment",
          genreId: actionGenre.id,
          platformId: ps5Platform.id,
        },
      ];

      await Game.bulkCreate(games);
      console.log("🎲 Sample games created");
    }

    console.log("✅ Sample data creation completed!");
  } catch (error) {
    console.error("❌ Error creating sample data:", error);
    // Não lançar erro para não impedir a inicialização do servidor
  }
}

module.exports = {
  sequelize,
  syncDatabase,
  createSampleData,
  User,
  Game,
  Genre,
  Platform,
};
