// Middleware para verificar se o usuário está autenticado
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect("/auth/login");
  }
}

// Middleware para redirecionar usuários já autenticados
function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    res.redirect("/dashboard");
  } else {
    next();
  }
}

module.exports = {
  requireAuth,
  redirectIfAuthenticated,
};
