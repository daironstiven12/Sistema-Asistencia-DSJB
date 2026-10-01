/* Punto único de intercambio entre datos simulados y API real.
   Cambiar `dataSource` por el cliente HTTP es el único cambio necesario
   para pasar a producción. Ninguna pantalla importa `data/mock` directo. */

import * as mock from "./mock";

export const dataSource = mock;

export const COLLECTIONS = {
  INSTITUCIONES: "instituciones",
  FACULTADES: "facultades",
  PROGRAMAS: "programas",
  PLANES: "planesEstudio",
  NIVELES: "niveles",
  ASIGNATURAS: "asignaturas",
  PLAN_ASIGNATURAS: "planAsignaturas",
  PRERREQUISITOS: "subjectPrerequisites",
  PERIODOS: "periodos",
  ROLES: "roles",
  PERSONAS: "personas",
  USUARIOS: "usuarios",
  DOCENTES: "docentes",
  ESTUDIANTES: "estudiantes",
  REPRESENTANTES: "representantes",
  FIRMAS: "firmas",
  RECORD_SIGNATURES: "recordSignatures",
  SESSION_SIGNATURES: "sessionSignatures",
  GRUPOS: "grupos",
  OFFERINGS: "offerings",
  TEACHING: "teachingAssignments",
  REPRESENTATIVE_ASSIGNMENTS: "representativeAssignments",
  SESSIONS: "sessions",
  RECORDS: "records",
  AUDIT: "auditLogs",
};
