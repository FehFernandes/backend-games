const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { User, Loan, Book, Author } = require("../models");

const router = express.Router();

// Aplicar middleware de autenticação a todas as rotas
router.use(requireAuth);

// Listar todos os usuários
router.get("/", async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Loan, as: "loans" }],
      order: [["username", "ASC"]],
    });

    res.render("users/list", {
      title: "Usuários - Sistema Biblioteca",
      users,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    req.session.error = "Erro ao carregar usuários";
    res.redirect("/dashboard");
  }
});

// Exibir detalhes de um usuário
router.get("/:id", async (req, res) => {
  try {
    const userDetail = await User.findByPk(req.params.id, {
      include: [
        {
          model: Loan,
          as: "loans",
          include: [
            {
              model: Book,
              as: "book",
              include: [{ model: Author, as: "author" }],
            },
          ],
          order: [["loanDate", "DESC"]],
        },
      ],
    });

    if (!userDetail) {
      req.session.error = "Usuário não encontrado";
      return res.redirect("/users");
    }

    res.render("users/detail", {
      title: `${userDetail.username} - Sistema Biblioteca`,
      userDetail,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao carregar usuário:", error);
    req.session.error = "Erro ao carregar usuário";
    res.redirect("/users");
  }
});

// Excluir usuário
router.post("/:id/delete", async (req, res) => {
  try {
    const userToDelete = await User.findByPk(req.params.id, {
      include: [{ model: Loan, as: "loans" }],
    });

    if (!userToDelete) {
      req.session.error = "Usuário não encontrado";
      return res.redirect("/users");
    }

    // Verificar se é o próprio usuário tentando se excluir
    if (userToDelete.id === req.session.user.id) {
      req.session.error = "Você não pode excluir sua própria conta";
      return res.redirect(`/users/${userToDelete.id}`);
    }

    // Verificar se há empréstimos ativos
    const activeLoans = userToDelete.loans.filter((loan) => !loan.returnedAt);
    if (activeLoans.length > 0) {
      req.session.error =
        "Não é possível excluir usuário com empréstimos ativos";
      return res.redirect(`/users/${userToDelete.id}`);
    }

    await userToDelete.destroy();
    req.session.success = "Usuário excluído com sucesso!";
    res.redirect("/users");
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    req.session.error = "Erro ao excluir usuário";
    res.redirect(`/users/${req.params.id}`);
  }
});

module.exports = router;
