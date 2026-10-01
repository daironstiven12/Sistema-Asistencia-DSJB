/* Selectores de alcance por rol. Todo panel opera sobre un subconjunto
   del estado: el docente solo ve sus asignaciones y el estudiante solo
   las suyas. Concentrarlo aquí evita filtrar en cada componente. */

import { IDENTIDAD_MOCK } from "./roleConfig";
import { asistenciaDeEstudiante } from "./selectors";

/* ── Docente ────────────────────────────────────────────────── */

export function docenteActual(db, personaId = IDENTIDAD_MOCK.docente) {
  const docente = db.docentes.find((d) => d.personaId === personaId) ?? db.docentes[0];
  return docente ?? null;
}

/* Asignaciones activas del docente con su oferta y grupo resueltos. */
export function clasesDelDocente(db, personaId) {
  const docente = docenteActual(db, personaId);
  if (!docente) return [];
  return db.teachingAssignments
    .filter((a) => a.docenteId === docente.id && a.estado === "Activa")
    .map((a) => {
      const oferta = db.offerings.find(
        (o) =>
          o.docenteId === docente.id &&
          o.asignaturaId === a.asignaturaId &&
          o.grupoId === a.grupoId &&
          o.periodoId === a.periodoId,
      );
      return {
        ...a,
        oferta,
        asignatura: db.asignaturas.find((s) => s.id === a.asignaturaId)?.nombre ?? "—",
        grupo: db.grupos.find((g) => g.id === a.grupoId) ?? null,
        periodo: db.periodos.find((p) => p.id === a.periodoId)?.nombre ?? "—",
        horario: oferta?.horario ?? "",
      };
    });
}

/* Sesiones del docente, ordenadas por fecha descendente. */
export function sesionesDelDocente(db, personaId) {
  const clases = clasesDelDocente(db, personaId);
  const ofertaIds = new Set(clases.map((c) => c.oferta?.id).filter(Boolean));
  return db.sessions
    .filter((s) => ofertaIds.has(s.offeringId))
    .sort((a, b) => `${b.fecha}${b.horaInicio}`.localeCompare(`${a.fecha}${a.horaInicio}`));
}

/* Estudiantes matriculados en los grupos del docente, agrupados por clase. */
export function estudiantesPorClase(db, claseId) {
  const clase = clasesDelDocente(db).find((c) => c.id === claseId);
  if (!clase) return [];
  return db.estudiantes
    .filter((e) => e.grupoId === clase.grupoId && e.estado === "Activo")
    .map((estudiante) => ({
      ...estudiante,
      asistencia: asistenciaDeEstudiante(db, estudiante.id),
    }))
    .sort((a, b) => a.asistencia.pct - b.asistencia.pct);
}

/* ── Estudiante ─────────────────────────────────────────────── */

export function estudianteActual(db, personaId = IDENTIDAD_MOCK.estudiante) {
  const estudiante = db.estudiantes.find((e) => e.personaId === personaId) ?? db.estudiantes[0];
  return estudiante ?? null;
}

/* Sesiones en las que el estudiante tiene registro propio, ordenadas de más
   reciente a más antigua. Es el alcance que habilita el registro propio. */
export function sesionesDelEstudiante(db, personaId) {
  const estudiante = estudianteActual(db, personaId);
  if (!estudiante) return [];
  const ids = new Set(
    db.records.filter((r) => r.estudianteId === estudiante.id).map((r) => r.sesionId),
  );
  return db.sessions
    .filter((s) => ids.has(s.id))
    .sort((a, b) => `${b.fecha}${b.horaInicio}`.localeCompare(`${a.fecha}${a.horaInicio}`));
}

/* Materias del estudiante con su docente, horario y conteos. El origen son
   los registros propios: es la carga real, no la oferta completa del grupo. */
export function materiasDelEstudiante(db, personaId) {
  const estudiante = estudianteActual(db, personaId);
  if (!estudiante) return [];
  return accrualPorAsignatura(db, estudiante.id).materias;
}

/* Detalle cronológico del estudiante, con la asignatura resuelta. */
function eventosEstudiante(db, personaId) {
  const estudiante = estudianteActual(db, personaId);
  if (!estudiante) return [];
  return db.records
    .filter((r) => r.estudianteId === estudiante.id)
    .map((registro) => {
      const sesion = db.sessions.find((s) => s.id === registro.sesionId);
      const oferta = sesion ? db.offerings.find((o) => o.id === sesion.offeringId) : null;
      return {
        ...registro,
        fecha: sesion?.fecha ?? "",
        tema: sesion?.tema ?? "—",
        grupo: db.grupos.find((g) => g.id === sesion?.grupoId)?.nombre ?? "—",
        asignatura: db.asignaturas.find((a) => a.id === oferta?.asignaturaId)?.nombre ?? "—",
        estadoSesion: sesion?.estado ?? "—",
      };
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/* Agrupa registros del estudiante por asignatura. El detalle queda ordenado
   de menor a mayor asistencia: es el orden en el que la interfaz muestra
   los riesgos. */
export function accrualPorAsignatura(db, estudianteId) {
  const registros = db.records.filter((r) => r.estudianteId === estudianteId);
  const sesionIds = new Set(registros.map((r) => r.sesionId));
  const asignaturas = new Map();

  db.sessions
    .filter((s) => sesionIds.has(s.id))
    .forEach((sesion) => {
      const oferta = db.offerings.find((o) => o.id === sesion.offeringId);
      if (!oferta) return;
      const actual =
        asignaturas.get(oferta.asignaturaId) ??
        {
          asignaturaId: oferta.asignaturaId,
          asignatura: db.asignaturas.find((a) => a.id === oferta.asignaturaId)?.nombre ?? "—",
          docente: db.docentes.find((d) => d.id === oferta.docenteId)?.nombre ?? "—",
          creditos:
            db.asignaturas.find((a) => a.id === oferta.asignaturaId)?.creditos ?? 0,
          horario: oferta.horario ?? "",
          total: 0,
          presentes: 0,
          sesiones: 0,
          ultima: "",
        };
      const deLaSesion = registros.filter((r) => r.sesionId === sesion.id);
      actual.total += deLaSesion.length;
      actual.presentes += deLaSesion.filter((r) => r.estado === "Presente").length;
      actual.sesiones += 1;
      if (sesion.fecha > actual.ultima) actual.ultima = sesion.fecha;
      asignaturas.set(oferta.asignaturaId, actual);
    });

  const materias = Array.from(asignaturas.values())
    .map((row) => ({
      ...row,
      pct: row.total ? Math.round((row.presentes / row.total) * 100) : 0,
    }))
    .sort((a, b) => a.pct - b.pct);

  const total = materias.reduce((acc, m) => acc + m.total, 0);
  const presentes = materias.reduce((acc, m) => acc + m.presentes, 0);

  return {
    materias,
    materiaIds: materias.map((m) => m.asignaturaId),
    total,
    presentes,
    pct: total ? Math.round((presentes / total) * 100) : 0,
  };
}

/* Historial del estudiante en la forma que consume el panel: el resumen por
   asignatura más el detalle cronológico. */
export function historialEstudiante(db, personaId) {
  const estudiante = estudianteActual(db, personaId);
  if (!estudiante) {
    return { total: 0, presentes: 0, pct: 0, detalle: [], materiaIds: [], eventos: [] };
  }
  const accrual = accrualPorAsignatura(db, estudiante.id);
  return {
    ...accrual,
    detalle: accrual.materias,
    eventos: eventosEstudiante(db, personaId),
  };
}

/* ── Representante ──────────────────────────────────────────── */

export function representanteActual(db, personaId = IDENTIDAD_MOCK.representante) {
  return db.representantes.find((r) => r.personaId === personaId) ?? db.representantes[0] ?? null;
}

export function gruposDelRepresentante(db, personaId) {
  const representante = representanteActual(db, personaId);
  if (!representante) return [];
  const asignaciones = db.representativeAssignments.filter(
    (a) => a.representanteId === representante.id,
  );
  return asignaciones
    .map((a) => {
      const grupo = db.grupos.find((g) => g.id === a.grupoId);
      if (!grupo) return null;
      return {
        ...grupo,
        matriculados: db.estudiantes.filter(
          (e) => e.grupoId === grupo.id && e.estado === "Activo",
        ).length,
      };
    })
    .filter(Boolean);
}

/* Sesiones del grupo representado que el representante puede revisar. */
export function sesionesRepresentadas(db, personaId) {
  const ids = new Set(gruposDelRepresentante(db, personaId).map((g) => g.id));
  return db.sessions
    .filter((s) => ids.has(s.grupoId))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}
