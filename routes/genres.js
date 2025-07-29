const express = require("express");
const { Genre, Game } = require("../models");
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

// GET /api/genres - Listar todos os gêneros
router.get("/", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search,
      includeGameCount = false,
      sortBy = "name",
      sortOrder = "ASC"
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Construir condições de busca
    const whereConditions = {};
    
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Validar campos de ordenação
    const validSortFields = ["name", "createdAt"];
    const orderBy = validSortFields.includes(sortBy) ? sortBy : "name";
    const order = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

    // Configurar includes se solicitado
    const include = [];
    if (includeGameCount === "true") {
      include.push({
        model: Game,
        as: "games",
        attributes: []
      });
    }

    const { count, rows } = await Genre.findAndCountAll({
      where: whereConditions,
      include,
      attributes: includeGameCount === "true" ? 
        ["id", "name", "description", "createdAt", "updatedAt", [Genre.sequelize.fn("COUNT", Genre.sequelize.col("games.id")), "gameCount"]] :
        ["id", "name", "description", "createdAt", "updatedAt"],
      group: includeGameCount === "true" ? ["Genre.id"] : undefined,
      limit: parseInt(limit),
      offset: offset,
      order: [[orderBy, order]],
      distinct: true
    });

    res.json({
      genres: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      },
      filters: {
        search,
        includeGameCount,
        sortBy: orderBy,
        sortOrder: order
      }
    });
  } catch (error) {
    console.error("Error fetching genres:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      message: "Failed to fetch genres" 
    });
  }
});

// GET /api/genres/:id - Obter um gênero específico
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { includeGames = false } = req.query;

    const include = [];
    if (includeGames === "true") {
      include.push({
        model: Game,
        as: "games",
        attributes: ["id", "name", "rating", "releaseDate", "developer", "publisher"],
        include: [{
          model: require("../models").Platform,
          as: "platform",
          attributes: ["id", "name", "manufacturer"]
        }]
      });
    }

    const genre = await Genre.findByPk(id, { include });

    if (!genre) {
      return res.status(404).json({ 
        error: "Genre not found", 
        message: `Genre with ID ${id} not found` 
      });
    }

    res.json({ genre });
  } catch (error) {
    console.error("Error fetching genre:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      message: "Failed to fetch genre" 
    });
  }
});

// POST /api/genres - Criar novo gênero
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validações básicas
    if (!name) {
      return res.status(400).json({ 
        error: "Validation error", 
        message: "Name is required" 
      });
    }

    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ 
        error: "Validation error", 
        message: "Name must be between 2 and 50 characters" 
      });
    }

    // Verificar se gênero já existe
    const existingGenre = await Genre.findOne({ 
      where: { name: { [Op.iLike]: name } } 
    });

    if (existingGenre) {
      return res.status(409).json({ 
        error: "Genre already exists", 
        message: "A genre with this name already exists" 
      });
    }

    const genre = await Genre.create({
      name: name.trim(),
      description: description ? description.trim() : null
    });

    res.status(201).json({
      message: "Genre created successfully",
      genre
    });
  } catch (error) {
    console.error("Error creating genre:", error);
    
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ 
        error: "Validation error", 
        message: error.errors.map(e => e.message).join(", ") 
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ 
        error: "Genre already exists", 
        message: "A genre with this name already exists" 
      });
    }

    res.status(500).json({ 
      error: "Internal server error", 
      message: "Failed to create genre" 
    });
  }
});

// PUT /api/genres/:id - Atualizar gênero
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const genre = await Genre.findByPk(id);

    if (!genre) {
      return res.status(404).json({ 
        error: "Genre not found", 
        message: `Genre with ID ${id} not found` 
      });
    }

    // Validar nome se fornecido
    if (name !== undefined) {
      if (!name || name.length < 2 || name.length > 50) {
        return res.status(400).json({ 
          error: "Validation error", 
          message: "Name must be between 2 and 50 characters" 
        });
      }

      // Verificar se outro gênero já tem esse nome
      const existingGenre = await Genre.findOne({ 
        where: { 
          name: { [Op.iLike]: name },
          id: { [Op.ne]: id }
        } 
      });

      if (existingGenre) {
        return res.status(409).json({ 
          error: "Genre already exists", 
          message: "Another genre with this name already exists" 
        });
      }
    }

    // Atualizar apenas os campos fornecidos
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;

    await genre.update(updateData);

    res.json({
      message: "Genre updated successfully",
      genre
    });
  } catch (error) {
    console.error("Error updating genre:", error);
    
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ 
        error: "Validation error", 
        message: error.errors.map(e => e.message).join(", ") 
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ 
        error: "Genre already exists", 
        message: "A genre with this name already exists" 
      });
    }

    res.status(500).json({ 
      error: "Internal server error", 
      message: "Failed to update genre" 
    });
  }
});

// DELETE /api/genres/:id - Deletar gênero
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const genre = await Genre.findByPk(id);

    if (!genre) {
      return res.status(404).json({ 
        error: "Genre not found", 
        message: `Genre with ID ${id} not found` 
      });
    }

    // Verificar se há jogos usando este gênero
    const gameCount = await Game.count({ where: { genreId: id } });

    if (gameCount > 0) {
      return res.status(400).json({ 
        error: "Cannot delete genre", 
        message: `Cannot delete genre. ${gameCount} game(s) are using this genre.`,
        gamesCount: gameCount
      });
    }

    await genre.destroy();

    res.json({
      message: "Genre deleted successfully",
      deletedGenre: {
        id: genre.id,
        name: genre.name
      }
    });
  } catch (error) {
    console.error("Error deleting genre:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      message: "Failed to delete genre" 
    });
  }
});

module.exports = router; 