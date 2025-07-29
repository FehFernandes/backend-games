const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { Student, Teacher, Course, Enrollment } = require("../models");

const router = express.Router();

// middleware de autenticação a todas as rotas do dashboard
router.use(requireAuth);

// Rota principal do dashboard
router.get("/", async (req, res) => {
  try {
    // Buscar estatísticas do sistema
    const totalStudents = await Student.count();
    const activeStudents = await Student.count({ where: { status: "ativo" } });

    const totalTeachers = await Teacher.count();
    const activeTeachers = await Teacher.count({ where: { status: "ativo" } });

    const totalCourses = await Course.count();
    const activeCourses = await Course.count({ where: { status: "ativo" } });

    const totalEnrollments = await Enrollment.count();
    const activeEnrollments = await Enrollment.count({
      where: { status: "ativa" },
    });

    // Buscar matrículas recentes
    const recentEnrollments = await Enrollment.findAll({
      include: [
        { model: Student, as: "student" },
        { model: Course, as: "course" },
      ],
      order: [["enrollmentDate", "DESC"]],
      limit: 5,
    });

    // Buscar cursos com mais alunos
    const popularCourses = await Course.findAll({
      include: [
        {
          model: Enrollment,
          as: "enrollments",
          where: { status: "ativa" },
          required: false,
        },
        { model: Teacher, as: "teacher" },
      ],
      order: [[{ model: Enrollment, as: "enrollments" }, "id", "DESC"]],
      limit: 5,
    });

    res.render("dashboard", {
      title: "Dashboard - Sistema Acadêmico SalaDeAula",
      user: req.session.user,
      stats: {
        totalStudents,
        activeStudents,
        totalTeachers,
        activeTeachers,
        totalCourses,
        activeCourses,
        totalEnrollments,
        activeEnrollments,
      },
      recentEnrollments,
      popularCourses,
    });
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    res.render("dashboard", {
      title: "Dashboard - Sistema Acadêmico SalaDeAula",
      user: req.session.user,
      error: "Erro ao carregar dados do dashboard",
    });
  }
});

// Rota para perfil do usuário
router.get("/profile", (req, res) => {
  res.render("profile", {
    title: "Perfil - Sistema Acadêmico SalaDeAula",
    user: req.session.user,
  });
});

module.exports = router;
