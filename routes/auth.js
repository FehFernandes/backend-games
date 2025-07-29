const express = require("express");
const { User } = require("../models");

const router = express.Router();

// Middleware para verificar se usuário está autenticado
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ 
      error: "Unauthorized", 
      message: "Authentication required" 
    });
  }
  next();
};

// Middleware para verificar se usuário NÃO está autenticado
const requireGuest = (req, res, next) => {
  if (req.session.user) {
    return res.status(400).json({ 
      error: "Already authenticated", 
      message: "User already logged in" 
    });
  }
  next();
};

// POST /api/auth/register - Registrar novo usuário
router.post("/register", requireGuest, async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validações básicas
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: "Validation error", 
        message: "Username, email, and password are required" 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        error: "Validation error", 
        message: "Passwords do not match" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: "Validation error", 
        message: "Password must be at least 6 characters long" 
      });
    }

    // Verificar se usuário já existe
    const existingUser = await User.findOne({
      where: {
        [User.sequelize.Sequelize.Op.or]: [
          { username: username },
          { email: email }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: "User already exists", 
        message: "Username or email already taken" 
      });
    }

    // Criar usuário
    const user = await User.create({
      username,
      email,
      password,
    });

    // Resposta de sucesso (sem senha)
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ 
        error: "Validation error", 
        message: error.errors.map(e => e.message).join(", ") 
      });
    }

    res.status(500).json({ 
      error: "Internal server error", 
      message: "Failed to register user" 
    });
  }
});

// POST /api/auth/login - Login do usuário
router.post("/login", requireGuest, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        error: "Validation error", 
        message: "Username and password are required" 
      });
    }

    // Procurar usuário por username ou email
    const user = await User.findByLogin(username);

    if (!user) {
      return res.status(401).json({ 
        error: "Authentication failed", 
        message: "Invalid username or password" 
      });
    }

    // Verificar senha
    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({ 
        error: "Authentication failed", 
        message: "Invalid username or password" 
      });
    }

    // Login bem-sucedido - criar sessão
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      message: "Failed to login" 
    });
  }
});

// POST /api/auth/logout - Logout do usuário
router.post("/logout", requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ 
        error: "Internal server error", 
        message: "Failed to logout" 
      });
    }

    res.clearCookie("connect.sid"); // Nome padrão do cookie de sessão
    res.json({ 
      message: "Logout successful" 
    });
  });
});

// GET /api/auth/me - Obter informações do usuário logado
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.user.id, {
      attributes: ["id", "username", "email", "createdAt", "updatedAt"]
    });

    if (!user) {
      return res.status(404).json({ 
        error: "User not found", 
        message: "User session is invalid" 
      });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      message: "Failed to get user information" 
    });
  }
});

// GET /api/auth/status - Verificar status de autenticação
router.get("/status", (req, res) => {
  res.json({
    isAuthenticated: !!req.session.user,
    user: req.session.user || null,
  });
});

module.exports = router;
