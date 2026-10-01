/* Fuente de datos simulada. Devuelve el estado inicial completo.
   La forma del objeto es la que la API real deberá cumplir. */

import * as catalog from "@/data/mock/catalog";
import * as people from "@/data/mock/people";
import * as operations from "@/data/mock/operations";

export const seed = {
  instituciones: catalog.instituciones,
  facultades: catalog.facultades,
  programas: catalog.programas,
  planesEstudio: catalog.planesEstudio,
  niveles: catalog.niveles,
  asignaturas: catalog.asignaturas,
  planAsignaturas: catalog.planAsignaturas,
  subjectPrerequisites: catalog.subjectPrerequisites,
  periodos: catalog.periodos,

  roles: people.roles,
  personas: people.personas,
  usuarios: people.usuarios,
  docentes: people.docentes,
  estudiantes: people.estudiantes,
  representantes: people.representantes,
  firmas: people.firmas,

  grupos: operations.grupos,
  offerings: operations.offerings,
  teachingAssignments: operations.teachingAssignments,
  representativeAssignments: operations.representativeAssignments,
  sessions: operations.attendanceSessions,
  records: operations.attendanceRecords,
  recordSignatures: operations.recordSignatures,
  sessionSignatures: operations.sessionSignatures,
  auditLogs: operations.auditLogs,

  /* Configuración de la plataforma: preferencias que el administrador
     ajusta y que el resto de módulos leen. */
  config: {
    umbralRiesgo: 75,
    toleranciaFaltas: 3,
    sesionesAntesDeFirmar: 1,
    notificarRepresentantes: true,
    registroPorDefecto: "QR",
  },
};

export const collections = Object.keys(seed);

/* Latencia simulada: la UI debe estar preparada para respuestas asíncronas. */
export function load() {
  return Promise.resolve(structuredClone(seed));
}

export function save() {
  return Promise.resolve({ ok: true });
}
