const express = require("express");
const router = express.Router();
const { Teacher, Course } = require("../models");
const { requireAuth } = require("../middleware/auth");

// Middleware de autenticação para todas as rotas
router.use(requireAuth);

// Listar todos os professores
router.get("/", async (req, res) => {
  try {
    const teachers = await Teacher.findAll({
      include: [
        {
          model: Course,
          as: "courses",
        },
      ],
      order: [["name", "ASC"]],
    });

    res.render("teachers/list", {
      title: "Lista de Professores",
      teachers,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao buscar professores:", error);
    res.status(500).render("error", {
      message: "Erro ao carregar lista de professores",
      error,
    });
  }
});

// Formulário para novo professor
router.get("/new", (req, res) => {
  res.render("teachers/form", {
    title: "Novo Professor",
    teacher: {},
    user: req.session.user,
  });
});

// Criar novo professor
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      document,
      specialization,
      department,
      hireDate,
      salary,
      status,
      birthDate,
      address,
      bio,
    } = req.body;

    await Teacher.create({
      name,
      email,
      phone,
      document,
      specialization,
      department,
      hireDate: hireDate || new Date(),
      salary: salary || null,
      status: status || "ativo",
      birthDate: birthDate || null,
      address,
      bio,
    });

    res.redirect("/teachers?success=Professor criado com sucesso!");
  } catch (error) {
    console.error("Erro ao criar professor:", error);
    res.render("teachers/form", {
      title: "Novo Professor",
      teacher: req.body,
      error: "Erro ao criar professor. Verifique os dados e tente novamente.",
      user: req.session.user,
    });
  }
});

// Visualizar detalhes do professor
router.get("/:id", async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, {
      include: [
        {
          model: Course,
          as: "courses",
        },
      ],
    });

    if (!teacher) {
      return res.status(404).render("error", {
        message: "Professor não encontrado",
      });
    }

    res.render("teachers/detail", {
      title: `Professor: ${teacher.name}`,
      teacher,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao buscar professor:", error);
    res.status(500).render("error", {
      message: "Erro ao carregar dados do professor",
      error,
    });
  }
});

// Formulário para editar professor
router.get("/:id/edit", async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id);

    if (!teacher) {
      return res.status(404).render("error", {
        message: "Professor não encontrado",
      });
    }

    res.render("teachers/form", {
      title: `Editar Professor: ${teacher.name}`,
      teacher,
      isEdit: true,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao buscar professor:", error);
    res.status(500).render("error", {
      message: "Erro ao carregar dados do professor",
      error,
    });
  }
});

// Atualizar professor
router.post("/:id", async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id);

    if (!teacher) {
      return res.status(404).render("error", {
        message: "Professor não encontrado",
      });
    }

    const {
      name,
      email,
      phone,
      document,
      specialization,
      department,
      hireDate,
      salary,
      status,
      birthDate,
      address,
      bio,
    } = req.body;

    await teacher.update({
      name,
      email,
      phone,
      document,
      specialization,
      department,
      hireDate,
      salary: salary || null,
      status,
      birthDate: birthDate || null,
      address,
      bio,
    });

    res.redirect(
      `/teachers/${teacher.id}?success=Professor atualizado com sucesso!`
    );
  } catch (error) {
    console.error("Erro ao atualizar professor:", error);
    const teacher = await Teacher.findByPk(req.params.id);
    res.render("teachers/form", {
      title: `Editar Professor: ${teacher.name}`,
      teacher: { ...teacher.dataValues, ...req.body },
      isEdit: true,
      error:
        "Erro ao atualizar professor. Verifique os dados e tente novamente.",
      user: req.session.user,
    });
  }
});

// Deletar professor
router.post("/:id/delete", async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id);

    if (!teacher) {
      return res.status(404).render("error", {
        message: "Professor não encontrado",
      });
    }

    // Verificar se o professor tem cursos associados
    const coursesCount = await Course.count({
      where: {
        teacherId: teacher.id,
      },
    });

    if (coursesCount > 0) {
      return res.redirect(
        `/teachers/${teacher.id}?error=Não é possível excluir professor com cursos associados`
      );
    }

    await teacher.destroy();
    res.redirect("/teachers?success=Professor excluído com sucesso!");
  } catch (error) {
    console.error("Erro ao deletar professor:", error);
    res.redirect(`/teachers/${req.params.id}?error=Erro ao excluir professor`);
  }
});

module.exports = router;
