const express = require("express");
const router = express.Router();
const { Course, Teacher, Student, Enrollment } = require("../models");
const { requireAuth } = require("../middleware/auth");

// Middleware de autenticação para todas as rotas
router.use(requireAuth);

// Listar todos os cursos
router.get("/", async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [
        {
          model: Teacher,
          as: "teacher",
        },
        {
          model: Enrollment,
          as: "enrollments",
          include: [
            {
              model: Student,
              as: "student",
            },
          ],
        },
      ],
      order: [["name", "ASC"]],
    });

    res.render("courses/list", {
      title: "Lista de Cursos",
      courses,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao buscar cursos:", error);
    res.status(500).render("error", {
      message: "Erro ao carregar lista de cursos",
      error,
    });
  }
});

// Formulário para novo curso
router.get("/new", async (req, res) => {
  try {
    const teachers = await Teacher.findAll({
      where: { status: "ativo" },
      order: [["name", "ASC"]],
    });

    res.render("courses/form", {
      title: "Novo Curso",
      course: {},
      teachers,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao carregar professores:", error);
    res.status(500).render("error", {
      message: "Erro ao carregar formulário",
      error,
    });
  }
});

// Criar novo curso
router.post("/", async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      category,
      level,
      duration,
      workload,
      maxStudents,
      price,
      status,
      startDate,
      endDate,
      schedule,
      classroom,
      prerequisites,
      objectives,
      teacherId,
    } = req.body;

    await Course.create({
      name,
      code,
      description,
      category,
      level,
      duration: parseInt(duration),
      workload: parseInt(workload),
      maxStudents: parseInt(maxStudents) || 30,
      price: parseFloat(price) || null,
      status: status || "ativo",
      startDate: startDate || null,
      endDate: endDate || null,
      schedule,
      classroom,
      prerequisites,
      objectives,
      teacherId: teacherId || null,
    });

    res.redirect("/courses?success=Curso criado com sucesso!");
  } catch (error) {
    console.error("Erro ao criar curso:", error);
    const teachers = await Teacher.findAll({
      where: { status: "ativo" },
      order: [["name", "ASC"]],
    });
    res.render("courses/form", {
      title: "Novo Curso",
      course: req.body,
      teachers,
      error: "Erro ao criar curso. Verifique os dados e tente novamente.",
      user: req.session.user,
    });
  }
});

// Visualizar detalhes do curso
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: Teacher,
          as: "teacher",
        },
        {
          model: Enrollment,
          as: "enrollments",
          include: [
            {
              model: Student,
              as: "student",
            },
          ],
        },
      ],
    });

    if (!course) {
      return res.status(404).render("error", {
        message: "Curso não encontrado",
      });
    }

    res.render("courses/detail", {
      title: `Curso: ${course.name}`,
      course,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao buscar curso:", error);
    res.status(500).render("error", {
      message: "Erro ao carregar dados do curso",
      error,
    });
  }
});

// Formulário para editar curso
router.get("/:id/edit", async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    const teachers = await Teacher.findAll({
      where: { status: "ativo" },
      order: [["name", "ASC"]],
    });

    if (!course) {
      return res.status(404).render("error", {
        message: "Curso não encontrado",
      });
    }

    res.render("courses/form", {
      title: `Editar Curso: ${course.name}`,
      course,
      teachers,
      isEdit: true,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao buscar curso:", error);
    res.status(500).render("error", {
      message: "Erro ao carregar dados do curso",
      error,
    });
  }
});

// Atualizar curso
router.post("/:id", async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).render("error", {
        message: "Curso não encontrado",
      });
    }

    const {
      name,
      code,
      description,
      category,
      level,
      duration,
      workload,
      maxStudents,
      price,
      status,
      startDate,
      endDate,
      schedule,
      classroom,
      prerequisites,
      objectives,
      teacherId,
    } = req.body;

    await course.update({
      name,
      code,
      description,
      category,
      level,
      duration: parseInt(duration),
      workload: parseInt(workload),
      maxStudents: parseInt(maxStudents),
      price: parseFloat(price) || null,
      status,
      startDate: startDate || null,
      endDate: endDate || null,
      schedule,
      classroom,
      prerequisites,
      objectives,
      teacherId: teacherId || null,
    });

    res.redirect(`/courses/${course.id}?success=Curso atualizado com sucesso!`);
  } catch (error) {
    console.error("Erro ao atualizar curso:", error);
    const course = await Course.findByPk(req.params.id);
    const teachers = await Teacher.findAll({
      where: { status: "ativo" },
      order: [["name", "ASC"]],
    });
    res.render("courses/form", {
      title: `Editar Curso: ${course.name}`,
      course: { ...course.dataValues, ...req.body },
      teachers,
      isEdit: true,
      error: "Erro ao atualizar curso. Verifique os dados e tente novamente.",
      user: req.session.user,
    });
  }
});

// Deletar curso
router.post("/:id/delete", async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).render("error", {
        message: "Curso não encontrado",
      });
    }

    // Verificar se o curso tem matrículas ativas
    const activeEnrollments = await Enrollment.count({
      where: {
        courseId: course.id,
        status: "ativa",
      },
    });

    if (activeEnrollments > 0) {
      return res.redirect(
        `/courses/${course.id}?error=Não é possível excluir curso com matrículas ativas`
      );
    }

    await course.destroy();
    res.redirect("/courses?success=Curso excluído com sucesso!");
  } catch (error) {
    console.error("Erro ao deletar curso:", error);
    res.redirect(`/courses/${req.params.id}?error=Erro ao excluir curso`);
  }
});

module.exports = router;
