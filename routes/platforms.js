const express = require("express");
const { Platform, Game } = require("../models");
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

// GET /api/platforms - Listar todas as plataformas
router.get("/", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search,
      manufacturer,
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
        { manufacturer: { [Op.like]: `%${search}%` } }
      ];
    }

    if (manufacturer) {
      whereConditions.manufacturer = { [Op.like]: `%${manufacturer}%` };
    }

    // Validar campos de ordenação
    const validSortFields = ["name", "manufacturer", "releaseYear", "createdAt"];
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

    const { count, rows } = await Platform.findAndCountAll({
      where: whereConditions,
      include,
      attributes: includeGameCount === "true" ? 
        ["id", "name", "manufacturer", "releaseYear", "createdAt", "updatedAt", [Platform.sequelize.fn("COUNT", Platform.sequelize.col("games.id")), "gameCount"]] :
        ["id", "name", "manufacturer", "releaseYear", "createdAt", "updatedAt"],
      group: includeGameCount === "true" ? ["Platform.id"] : undefined,
      limit: parseInt(limit),
      offset: offset,
      order: [[orderBy, order]],
      distinct: true
    });

    res.json({
      platforms: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      },
      filters: {
        search,
        manufacturer,
        includeGameCount,
        sortBy: orderBy,
        sortOrder: order
      }
    });
  } catch (error) {
    console.error("Error fetching platforms:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      message: "Failed to fetch platforms" 
    });
  }
});

// GET /api/platforms/:id - Obter uma plataforma específica
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
          model: require("../models").Genre,
          as: "genre",
          attributes: ["id", "name", "description"]
        }]
      });
    }

    const platform = await Platform.findByPk(id, { include });

    if (!platform) {
      return res.status(404).json({ 
        error: "Platform not found", 
        message: `Platform with ID ${id} not found` 
      });
    }

    res.json({ platform });
  } catch (error) {
    console.error("Error fetching platform:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      message: "Failed to fetch platform" 
    });
  }
});

// POST /api/platforms - Criar nova plataforma
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, manufacturer, releaseYear } = req.body;

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

    // Validar ano de lançamento se fornecido
    const currentYear = new Date().getFullYear();
    if (releaseYear && (releaseYear < 1970 || releaseYear > currentYear + 5)) {
      return res.status(400).json({ 
        error: "Validation error", 
        message: `Release year must be between 1970 and ${currentYear + 5}` 
      });
    }

    // Verificar se plataforma já existe
    const existingPlatform = await Platform.findOne({ 
      where: { name: { [Op.iLike]: name } } 
    });

    if (existingPlatform) {
      return res.status(409).json({ 
        error: "Platform already exists", 
        message: "A platform with this name already exists" 
      });
    }

    const platform = await Platform.create({
      name: name.trim(),
      manufacturer: manufacturer ? manufacturer.trim() : null,
      releaseYear: releaseYear ? parseInt(releaseYear) : null
    });

    res.status(201).json({
      message: "Platform created successfully",
      platform
    });
  } catch (error) {
    console.error("Error creating platform:", error);
    
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ 
        error: "Validation error", 
        message: error.errors.map(e => e.message).join(", ") 
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ 
        error: "Platform already exists", 
        message: "A platform with this name already exists" 
      });
    }

    res.status(500).json({ 
      error: "Internal server error", 
      message: "Failed to create platform" 
    });
  }
});

// PUT /api/platforms/:id - Atualizar plataforma
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, manufacturer, releaseYear } = req.body;

    const platform = await Platform.findByPk(id);

    if (!platform) {
      return res.status(404).json({ 
        error: "Platform not found", 
        message: `Platform with ID ${id} not found` 
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

      // Verificar se outra plataforma já tem esse nome
      const existingPlatform = await Platform.findOne({ 
        where: { 
          name: { [Op.iLike]: name },
          id: { [Op.ne]: id }
        } 
      });

      if (existingPlatform) {
        return res.status(409).json({ 
          error: "Platform already exists", 
          message: "Another platform with this name already exists" 
        });
      }
    }

    // Validar ano de lançamento se fornecido
    if (releaseYear !== undefined && releaseYear !== null) {
      const currentYear = new Date().getFullYear();
      if (releaseYear < 1970 || releaseYear > currentYear + 5) {
        return res.status(400).json({ 
          error: "Validation error", 
          message: `Release year must be between 1970 and ${currentYear + 5}` 
        });
      }
    }

    // Atualizar apenas os campos fornecidos
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (manufacturer !== undefined) updateData.manufacturer = manufacturer ? manufacturer.trim() : null;
    if (releaseYear !== undefined) updateData.releaseYear = releaseYear ? parseInt(releaseYear) : null;

    await platform.update(updateData);

    res.json({
      message: "Platform updated successfully",
      platform
    });
  } catch (error) {
    console.error("Error updating platform:", error);
    
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ 
        error: "Validation error", 
        message: error.errors.map(e => e.message).join(", ") 
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ 
        error: "Platform already exists", 
        message: "A platform with this name already exists" 
      });
    }

    res.status(500).json({ 
      error: "Internal server error", 
      message: "Failed to update platform" 
    });
  }
});

// DELETE /api/platforms/:id - Deletar plataforma
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const platform = await Platform.findByPk(id);

    if (!platform) {
      return res.status(404).json({ 
        error: "Platform not found", 
        message: `Platform with ID ${id} not found` 
      });
    }

    // Verificar se há jogos usando esta plataforma
    const gameCount = await Game.count({ where: { platformId: id } });

    if (gameCount > 0) {
      return res.status(400).json({ 
        error: "Cannot delete platform", 
        message: `Cannot delete platform. ${gameCount} game(s) are using this platform.`,
        gamesCount: gameCount
      });
    }

    await platform.destroy();

    res.json({
      message: "Platform deleted successfully",
      deletedPlatform: {
        id: platform.id,
        name: platform.name
      }
    });
  } catch (error) {
    console.error("Error deleting platform:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      message: "Failed to delete platform" 
    });
  }
});

module.exports = router; 