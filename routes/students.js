const express = require("express");
const router = express.Router();
const { Student, Course, Enrollment } = require("../models");
const { requireAuth } = require("../middleware/auth");

// Middleware de autenticação para todas as rotas
router.use(requireAuth);

// Listar todos os alunos
router.get("/", async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        {
          model: Enrollment,
          as: "enrollments",
          include: [
            {
              model: Course,
              as: "course",
            },
          ],
        },
      ],
      order: [["name", "ASC"]],
    });

    res.render("students/list", {
      title: "Lista de Alunos",
      students,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao buscar alunos:", error);
    res.status(500).render("error", {
      message: "Erro ao carregar lista de alunos",
      error,
    });
  }
});

// Formulário para novo aluno
router.get("/new", (req, res) => {
  res.render("students/form", {
    title: "Novo Aluno",
    student: {},
    user: req.session.user,
  });
});

// Criar novo aluno
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      document,
      registration,
      birthDate,
      address,
      emergencyContact,
      emergencyPhone,
      academicLevel,
      status,
    } = req.body;

    await Student.create({
      name,
      email,
      phone,
      document,
      registration,
      birthDate: birthDate || null,
      address,
      emergencyContact,
      emergencyPhone,
      academicLevel,
      status: status || "ativo",
    });

    res.redirect("/students?success=Aluno criado com sucesso!");
  } catch (error) {
    console.error("Erro ao criar aluno:", error);
    res.render("students/form", {
      title: "Novo Aluno",
      student: req.body,
      error: "Erro ao criar aluno. Verifique os dados e tente novamente.",
      user: req.session.user,
    });
  }
});

// Visualizar detalhes do aluno
router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [
        {
          model: Enrollment,
          as: "enrollments",
          include: [
            {
              model: Course,
              as: "course",
            },
          ],
        },
      ],
    });

    if (!student) {
      return res.status(404).render("error", {
        message: "Aluno não encontrado",
      });
    }

    res.render("students/detail", {
      title: `Aluno: ${student.name}`,
      student,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao buscar aluno:", error);
    res.status(500).render("error", {
      message: "Erro ao carregar dados do aluno",
      error,
    });
  }
});

// Formulário para editar aluno
router.get("/:id/edit", async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);

    if (!student) {
      return res.status(404).render("error", {
        message: "Aluno não encontrado",
      });
    }

    res.render("students/form", {
      title: `Editar Aluno: ${student.name}`,
      student,
      isEdit: true,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao buscar aluno:", error);
    res.status(500).render("error", {
      message: "Erro ao carregar dados do aluno",
      error,
    });
  }
});

// Atualizar aluno
router.post("/:id", async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);

    if (!student) {
      return res.status(404).render("error", {
        message: "Aluno não encontrado",
      });
    }

    const {
      name,
      email,
      phone,
      document,
      registration,
      birthDate,
      address,
      emergencyContact,
      emergencyPhone,
      academicLevel,
      status,
    } = req.body;

    await student.update({
      name,
      email,
      phone,
      document,
      registration,
      birthDate: birthDate || null,
      address,
      emergencyContact,
      emergencyPhone,
      academicLevel,
      status,
    });

    res.redirect(
      `/students/${student.id}?success=Aluno atualizado com sucesso!`
    );
  } catch (error) {
    console.error("Erro ao atualizar aluno:", error);
    const student = await Student.findByPk(req.params.id);
    res.render("students/form", {
      title: `Editar Aluno: ${student.name}`,
      student: { ...student.dataValues, ...req.body },
      isEdit: true,
      error: "Erro ao atualizar aluno. Verifique os dados e tente novamente.",
      user: req.session.user,
    });
  }
});

// Deletar aluno
router.post("/:id/delete", async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);

    if (!student) {
      return res.status(404).render("error", {
        message: "Aluno não encontrado",
      });
    }

    // Verificar se o aluno tem matrículas ativas
    const activeEnrollments = await Enrollment.count({
      where: {
        studentId: student.id,
        status: "ativa",
      },
    });

    if (activeEnrollments > 0) {
      return res.redirect(
        `/students/${student.id}?error=Não é possível excluir aluno com matrículas ativas`
      );
    }

    await student.destroy();
    res.redirect("/students?success=Aluno excluído com sucesso!");
  } catch (error) {
    console.error("Erro ao deletar aluno:", error);
    res.redirect(`/students/${req.params.id}?error=Erro ao excluir aluno`);
  }
});

module.exports = router;
