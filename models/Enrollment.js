const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Enrollment = sequelize.define(
  "Enrollment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Students",
        key: "id",
      },
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Courses",
        key: "id",
      },
    },
    enrollmentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM("ativa", "cancelada", "concluida", "trancada"),
      defaultValue: "ativa",
    },
    grade: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 10,
      },
    },
    attendance: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    enrollmentType: {
      type: DataTypes.ENUM("regular", "transferencia", "reingresso"),
      defaultValue: "regular",
    },
    paymentStatus: {
      type: DataTypes.ENUM("pendente", "pago", "atrasado", "isento"),
      defaultValue: "pendente",
    },
    observations: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    completionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    certificate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    // Índice único para evitar matrículas duplicadas
    indexes: [
      {
        unique: true,
        fields: ["studentId", "courseId"],
        name: "unique_student_course_enrollment",
      },
    ],
  }
);

module.exports = Enrollment;
