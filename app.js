const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const gamesRoutes = require("./routes/games");
const genresRoutes = require("./routes/genres");
const platformsRoutes = require("./routes/platforms");
const { testConnection } = require("./config/database");
const { syncDatabase, createSampleData } = require("./models");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração CORS para frontend React
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5173",
      "http://localhost:3001",
      "https://preview-games-management-system-kzmgjjuf90clv8lzg9je.vusercontent.net",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);



// Configuração do middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuração de sessão
app.use(
  session({
    secret: "games-management-system-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Para desenvolvimento local
      maxAge: 1000 * 60 * 60 * 24, // 24 horas
      httpOnly: true,
    },
  })
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api/genres", genresRoutes);
app.use("/api/platforms", platformsRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Games Management API is running",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint - API info
app.get("/", (req, res) => {
  res.json({
    name: "Games Management API",
    version: "1.0.0",
    description: "RESTful API for managing games, genres, and platforms",
    endpoints: {
      auth: "/api/auth",
      games: "/api/games",
      genres: "/api/genres",
      platforms: "/api/platforms",
      health: "/api/health",
    },
  });
});

// Middleware de tratamento de erro 404
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: [
      "/api/auth",
      "/api/games",
      "/api/genres",
      "/api/platforms",
      "/api/health",
    ],
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Error:", error);
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

// Iniciar servidor
async function startServer() {
  try {
    // Testar conexão com banco de dados
    await testConnection();

    // Sincronizar modelos
    await syncDatabase();

    // Criar dados de exemplo
    await createSampleData();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Games Management API running on port ${PORT}`);
      console.log(`🌐 Access: http://localhost:${PORT}`);
      console.log(`📊 SQLite Database: database.sqlite`);
      console.log(`🎮 Game management system ready!`);
      console.log(`📋 API Endpoints:`);
      console.log(`   • POST   /api/auth/login`);
      console.log(`   • POST   /api/auth/register`);
      console.log(`   • POST   /api/auth/logout`);
      console.log(`   • GET    /api/games`);
      console.log(`   • POST   /api/games`);
      console.log(`   • PUT    /api/games/:id`);
      console.log(`   • DELETE /api/games/:id`);
      console.log(`   • GET    /api/genres`);
      console.log(`   • POST   /api/genres`);
      console.log(`   • PUT    /api/genres/:id`);
      console.log(`   • DELETE /api/genres/:id`);
      console.log(`   • GET    /api/platforms`);
      console.log(`   • POST   /api/platforms`);
      console.log(`   • PUT    /api/platforms/:id`);
      console.log(`   • DELETE /api/platforms/:id`);
    });
  } catch (error) {
    console.error("❌ Error starting server:", error);
    process.exit(1);
  }
}

startServer();
