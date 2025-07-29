const express = require("express");
const router = express.Router();
const { Enrollment, Student, Course, Teacher } = require("../models");
const { requireAuth } = require("../middleware/auth");

// Middleware de autenticação para todas as rotas
router.use(requireAuth);

// Listar todas as matrículas
router.get("/", async (req, res) => {
  try {
    const enrollments = await Enrollment.findAll({
      include: [
        {
          model: Student,
          as: "student",
        },
        {
          model: Course,
          as: "course",
          include: [
            {
              model: Teacher,
              as: "teacher",
            },
          ],
        },
      ],
      order: [["enrollmentDate", "DESC"]],
    });

    res.render("enrollments/list", {
      title: "Lista de Matrículas",
      enrollments,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao buscar matrículas:", error);
    res.status(500).render("error", {
      message: "Erro ao carregar lista de matrículas",
      error,
    });
  }
});

// Formulário para nova matrícula
router.get("/new", async (req, res) => {
  try {
    const students = await Student.findAll({
      where: { status: "ativo" },
      order: [["name", "ASC"]],
    });

    const courses = await Course.findAll({
      where: { status: "ativo" },
      include: [
        {
          model: Teacher,
          as: "teacher",
        },
      ],
      order: [["name", "ASC"]],
    });

    res.render("enrollments/form", {
      title: "Nova Matrícula",
      enrollment: {},
      students,
      courses,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    res.status(500).render("error", {
      message: "Erro ao carregar formulário",
      error,
    });
  }
});

// Criar nova matrícula
router.post("/", async (req, res) => {
  try {
    const { studentId, courseId, enrollmentType, paymentStatus, observations } =
      req.body;

    // Verificar se já existe matrícula ativa para este aluno neste curso
    const existingEnrollment = await Enrollment.findOne({
      where: {
        studentId,
        courseId,
        status: ["ativa", "trancada"],
      },
    });

    if (existingEnrollment) {
      const students = await Student.findAll({
        where: { status: "ativo" },
        order: [["name", "ASC"]],
      });
      const courses = await Course.findAll({
        where: { status: "ativo" },
        include: [{ model: Teacher, as: "teacher" }],
        order: [["name", "ASC"]],
      });

      return res.render("enrollments/form", {
        title: "Nova Matrícula",
        enrollment: req.body,
        students,
        courses,
        error: "Já existe uma matrícula ativa para este aluno neste curso.",
        user: req.session.user,
      });
    }

    // Verificar se o curso ainda tem vagas
    const course = await Course.findByPk(courseId);
    const enrollmentsCount = await Enrollment.count({
      where: {
        courseId,
        status: "ativa",
      },
    });

    if (enrollmentsCount >= course.maxStudents) {
      const students = await Student.findAll({
        where: { status: "ativo" },
        order: [["name", "ASC"]],
      });
      const courses = await Course.findAll({
        where: { status: "ativo" },
        include: [{ model: Teacher, as: "teacher" }],
        order: [["name", "ASC"]],
      });

      return res.render("enrollments/form", {
        title: "Nova Matrícula",
        enrollment: req.body,
        students,
        courses,
        error: "Este curso já atingiu o número máximo de alunos.",
        user: req.session.user,
      });
    }

    await Enrollment.create({
      studentId,
      courseId,
      enrollmentType: enrollmentType || "regular",
      paymentStatus: paymentStatus || "pendente",
      observations,
      status: "ativa",
    });

    res.redirect("/enrollments?success=Matrícula criada com sucesso!");
  } catch (error) {
    console.error("Erro ao criar matrícula:", error);
    const students = await Student.findAll({
      where: { status: "ativo" },
      order: [["name", "ASC"]],
    });
    const courses = await Course.findAll({
      where: { status: "ativo" },
      include: [{ model: Teacher, as: "teacher" }],
      order: [["name", "ASC"]],
    });

    res.render("enrollments/form", {
      title: "Nova Matrícula",
      enrollment: req.body,
      students,
      courses,
      error: "Erro ao criar matrícula. Verifique os dados e tente novamente.",
      user: req.session.user,
    });
  }
});

// Visualizar detalhes da matrícula
router.get("/:id", async (req, res) => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.id, {
      include: [
        {
          model: Student,
          as: "student",
        },
        {
          model: Course,
          as: "course",
          include: [
            {
              model: Teacher,
              as: "teacher",
            },
          ],
        },
      ],
    });

    if (!enrollment) {
      return res.status(404).render("error", {
        message: "Matrícula não encontrada",
      });
    }

    res.render("enrollments/detail", {
      title: `Matrícula: ${enrollment.student.name} - ${enrollment.course.name}`,
      enrollment,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao buscar matrícula:", error);
    res.status(500).render("error", {
      message: "Erro ao carregar dados da matrícula",
      error,
    });
  }
});

// Formulário para editar matrícula
router.get("/:id/edit", async (req, res) => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.id, {
      include: [
        {
          model: Student,
          as: "student",
        },
        {
          model: Course,
          as: "course",
        },
      ],
    });

    if (!enrollment) {
      return res.status(404).render("error", {
        message: "Matrícula não encontrada",
      });
    }

    res.render("enrollments/form", {
      title: `Editar Matrícula: ${enrollment.student.name} - ${enrollment.course.name}`,
      enrollment,
      isEdit: true,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao buscar matrícula:", error);
    res.status(500).render("error", {
      message: "Erro ao carregar dados da matrícula",
      error,
    });
  }
});

// Atualizar matrícula
router.post("/:id", async (req, res) => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.id);

    if (!enrollment) {
      return res.status(404).render("error", {
        message: "Matrícula não encontrada",
      });
    }

    const {
      status,
      grade,
      attendance,
      paymentStatus,
      observations,
      completionDate,
      certificate,
    } = req.body;

    await enrollment.update({
      status,
      grade: grade ? parseFloat(grade) : null,
      attendance: attendance ? parseFloat(attendance) : null,
      paymentStatus,
      observations,
      completionDate: completionDate || null,
      certificate: certificate === "on",
    });

    res.redirect(
      `/enrollments/${enrollment.id}?success=Matrícula atualizada com sucesso!`
    );
  } catch (error) {
    console.error("Erro ao atualizar matrícula:", error);
    const enrollment = await Enrollment.findByPk(req.params.id, {
      include: [
        { model: Student, as: "student" },
        { model: Course, as: "course" },
      ],
    });
    res.render("enrollments/form", {
      title: `Editar Matrícula: ${enrollment.student.name} - ${enrollment.course.name}`,
      enrollment: { ...enrollment.dataValues, ...req.body },
      isEdit: true,
      error:
        "Erro ao atualizar matrícula. Verifique os dados e tente novamente.",
      user: req.session.user,
    });
  }
});

// Deletar matrícula
router.post("/:id/delete", async (req, res) => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.id);

    if (!enrollment) {
      return res.status(404).render("error", {
        message: "Matrícula não encontrada",
      });
    }

    await enrollment.destroy();
    res.redirect("/enrollments?success=Matrícula excluída com sucesso!");
  } catch (error) {
    console.error("Erro ao deletar matrícula:", error);
    res.redirect(
      `/enrollments/${req.params.id}?error=Erro ao excluir matrícula`
    );
  }
});

module.exports = router;
