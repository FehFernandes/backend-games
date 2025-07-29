const express = require("express");
const { Game, Genre, Platform } = require("../models");
const { Op } = require("sequelize");

const router = express.Router();

// Middleware para verificar autenticação
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ 
      error: "Unauthorized", 
      message: "Authentication required" 
    });
  }
  next();
};

// GET /api/games - Listar todos os jogos com filtros opcionais
router.get("/", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      genreId, 
      platformId, 
      minRating, 
      maxRating,
      sortBy = "name",
      sortOrder = "ASC"
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Construir condições de busca
    const whereConditions = {};
    
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { developer: { [Op.like]: `%${search}%` } },
        { publisher: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (genreId) {
      whereConditions.genreId = genreId;
    }
    
    if (platformId) {
      whereConditions.platformId = platformId;
    }
    
    if (minRating || maxRating) {
      whereConditions.rating = {};
      if (minRating) whereConditions.rating[Op.gte] = parseFloat(minRating);
      if (maxRating) whereConditions.rating[Op.lte] = parseFloat(maxRating);
    }

    // Validar campos de ordenação
    const validSortFields = ["name", "rating", "releaseDate", "createdAt"];
    const orderBy = validSortFields.includes(sortBy) ? sortBy : "name";
    const order = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

    const { count, rows } = await Game.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Genre,
          as: "genre",
          attributes: ["id", "name", "description"]
        },
        {
          model: Platform,
          as: "platform", 
          attributes: ["id", "name", "manufacturer", "releaseYear"]
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [[orderBy, order]],
      distinct: true
    });

    res.json({
      games: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      },
      filters: {
        search,
        genreId,
        platformId,
        minRating,
        maxRating,
        sortBy: orderBy,
        sortOrder: order
      }
    });
  } catch (error) {
    console.error("Error fetching games:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      message: "Failed to fetch games" 
    });
  }
});

// GET /api/games/:id - Obter um jogo específico
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const game = await Game.findByPk(id, {
      include: [
        {
          model: Genre,
          as: "genre",
          attributes: ["id", "name", "description"]
        },
        {
          model: Platform,
          as: "platform",
          attributes: ["id", "name", "manufacturer", "releaseYear"]
        }
      ]
    });

    if (!game) {
      return res.status(404).json({ 
        error: "Game not found", 
        message: `Game with ID ${id} not found` 
      });
    }

    res.json({ game });
  } catch (error) {
    console.error("Error fetching game:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      message: "Failed to fetch game" 
    });
  }
});

// POST /api/games - Criar novo jogo
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      name,
      description,
      rating,
      releaseDate,
      developer,
      publisher,
      imageUrl,
      genreId,
      platformId
    } = req.body;

    // Validações básicas
    if (!name || !genreId || !platformId) {
      return res.status(400).json({ 
        error: "Validation error", 
        message: "Name, genre, and platform are required" 
      });
    }

    // Verificar se gênero e plataforma existem
    const [genre, platform] = await Promise.all([
      Genre.findByPk(genreId),
      Platform.findByPk(platformId)
    ]);

    if (!genre) {
      return res.status(400).json({ 
        error: "Validation error", 
        message: "Invalid genre ID" 
      });
    }

    if (!platform) {
      return res.status(400).json({ 
        error: "Validation error", 
        message: "Invalid platform ID" 
      });
    }

    // Validar rating se fornecido
    if (rating && (rating < 0 || rating > 10)) {
      return res.status(400).json({ 
        error: "Validation error", 
        message: "Rating must be between 0 and 10" 
      });
    }

    const game = await Game.create({
      name,
      description,
      rating: rating ? parseFloat(rating) : null,
      releaseDate,
      developer,
      publisher,
      imageUrl,
      genreId,
      platformId
    });

    // Buscar o jogo criado com relacionamentos
    const createdGame = await Game.findByPk(game.id, {
      include: [
        {
          model: Genre,
          as: "genre",
          attributes: ["id", "name", "description"]
        },
        {
          model: Platform,
          as: "platform",
          attributes: ["id", "name", "manufacturer", "releaseYear"]
        }
      ]
    });

    res.status(201).json({
      message: "Game created successfully",
      game: createdGame
    });
  } catch (error) {
    console.error("Error creating game:", error);
    
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ 
        error: "Validation error", 
        message: error.errors.map(e => e.message).join(", ") 
      });
    }

    res.status(500).json({ 
      error: "Internal server error", 
      message: "Failed to create game" 
    });
  }
});

// PUT /api/games/:id - Atualizar jogo
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      rating,
      releaseDate,
      developer,
      publisher,
      imageUrl,
      genreId,
      platformId
    } = req.body;

    const game = await Game.findByPk(id);

    if (!game) {
      return res.status(404).json({ 
        error: "Game not found", 
        message: `Game with ID ${id} not found` 
      });
    }

    // Verificar se gênero e plataforma existem (se fornecidos)
    if (genreId) {
      const genre = await Genre.findByPk(genreId);
      if (!genre) {
        return res.status(400).json({ 
          error: "Validation error", 
          message: "Invalid genre ID" 
        });
      }
    }

    if (platformId) {
      const platform = await Platform.findByPk(platformId);
      if (!platform) {
        return res.status(400).json({ 
          error: "Validation error", 
          message: "Invalid platform ID" 
        });
      }
    }

    // Validar rating se fornecido
    if (rating && (rating < 0 || rating > 10)) {
      return res.status(400).json({ 
        error: "Validation error", 
        message: "Rating must be between 0 and 10" 
      });
    }

    // Atualizar apenas os campos fornecidos
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (rating !== undefined) updateData.rating = rating ? parseFloat(rating) : null;
    if (releaseDate !== undefined) updateData.releaseDate = releaseDate;
    if (developer !== undefined) updateData.developer = developer;
    if (publisher !== undefined) updateData.publisher = publisher;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (genreId !== undefined) updateData.genreId = genreId;
    if (platformId !== undefined) updateData.platformId = platformId;

    await game.update(updateData);

    // Buscar o jogo atualizado com relacionamentos
    const updatedGame = await Game.findByPk(id, {
      include: [
        {
          model: Genre,
          as: "genre",
          attributes: ["id", "name", "description"]
        },
        {
          model: Platform,
          as: "platform",
          attributes: ["id", "name", "manufacturer", "releaseYear"]
        }
      ]
    });

    res.json({
      message: "Game updated successfully",
      game: updatedGame
    });
  } catch (error) {
    console.error("Error updating game:", error);
    
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ 
        error: "Validation error", 
        message: error.errors.map(e => e.message).join(", ") 
      });
    }

    res.status(500).json({ 
      error: "Internal server error", 
      message: "Failed to update game" 
    });
  }
});

// DELETE /api/games/:id - Deletar jogo
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const game = await Game.findByPk(id);

    if (!game) {
      return res.status(404).json({ 
        error: "Game not found", 
        message: `Game with ID ${id} not found` 
      });
    }

    await game.destroy();

    res.json({
      message: "Game deleted successfully",
      deletedGame: {
        id: game.id,
        name: game.name
      }
    });
  } catch (error) {
    console.error("Error deleting game:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      message: "Failed to delete game" 
    });
  }
});

module.exports = router; 