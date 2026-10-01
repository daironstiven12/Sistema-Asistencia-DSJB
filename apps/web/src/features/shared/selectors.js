/* Selectores de dominio. Funciones puras sobre el estado del provider.
   Toda agregación del panel vive aquí, no en los componentes. */

export const byId = (list, id) => list.find((item) => item.id === id) ?? null;
export const by = (list, key, value) =>
  list.filter((item) => item[key] === value);
export const nombreDe = (list, id, campo = "nombre") => byId(list, id)?.[campo] ?? "—";

export const activos = (list) => list.filter((item) => item.estado === "Activo");

/* Estudiantes con matrícula vigente. El estado es el enum del contrato:
   ACTIVE, INACTIVE, GRADUATED o WITHDRAWN. */
export const estudiantesActivos = (list) => list.filter((e) => e.estado === "ACTIVE");

/* Catálogo */
export function indexCatalog(db) {
  return {
    facultad: new Map(db.facultades.map((x) => [x.id, x])),
    programa: new Map(db.programas.map((x) => [x.id, x])),
    plan: new Map(db.planesEstudio.map((x) => [x.id, x])),
    nivel: new Map(db.niveles.map((x) => [x.id, x])),
    asignatura: new Map(db.asignaturas.map((x) => [x.id, x])),
    periodo: new Map(db.periodos.map((x) => [x.id, x])),
    grupo: new Map(db.grupos.map((x) => [x.id, x])),
    docente: new Map(db.docentes.map((x) => [x.id, x])),
    estudiante: new Map(db.estudiantes.map((x) => [x.id, x])),
    representante: new Map(db.representantes.map((x) => [x.id, x])),
    persona: new Map(db.personas.map((x) => [x.id, x])),
  };
}

/* Una entidad decorada con sus nombres legibles, lista para renderizar. */
export function enrichSession(db, session) {
  const idx = indexCatalog(db);
  const offering = byId(db.offerings, session.offeringId);
  return {
    ...session,
    asignatura: idx.asignatura.get(offering?.asignaturaId)?.nombre ?? "—",
    asignaturaId: offering?.asignaturaId ?? null,
    docente: idx.docente.get(offering?.docenteId)?.nombre ?? "—",
    docenteId: offering?.docenteId ?? null,
    grupo: idx.grupo.get(session.grupoId)?.nombre ?? "—",
    programa: idx.programa.get(idx.grupo.get(session.grupoId)?.programaId)?.nombre ?? "—",
    nivel: idx.nivel.get(idx.grupo.get(session.grupoId)?.nivelId)?.nombre ?? "—",
    periodo: idx.periodo.get(session.periodoId)?.nombre ?? "—",
    registros: db.records.filter((r) => r.sesionId === session.id),
  };
}

export function sessionStats(db, sessionId) {
  const rows = db.records.filter((r) => r.sesionId === sessionId);
  const presentes = rows.filter((r) => r.estado === "Presente").length;
  const ausentes = rows.filter((r) => r.estado === "Ausente").length;
  const manuales = rows.filter((r) => r.manual).length;
  return {
    total: rows.length,
    presentes,
    ausentes,
    pendientes: rows.length - presentes - ausentes,
    manuales,
    pct: rows.length ? Math.round((presentes / rows.length) * 100) : 0,
  };
}

/* Un docente puede tener varias asignaturas y grupos: se agrega todo.
   teaching_assignments y course_offerings son tablas distintas, así que
   la relación se hace por docente + asignatura + grupo + periodo, nunca
   por id, porque sus identificadores no se corresponden. */
export function docenteCarga(db, docenteId) {
  const asignaciones = by(db.teachingAssignments, "docenteId", docenteId);
  const idx = indexCatalog(db);
  const carga = asignaciones.map((a) => ({
    ...a,
    asignatura: idx.asignatura.get(a.asignaturaId)?.nombre ?? "—",
    grupo: idx.grupo.get(a.grupoId)?.nombre ?? "—",
    periodo: idx.periodo.get(a.periodoId)?.nombre ?? "—",
    docente: idx.docente.get(a.docenteId)?.nombre ?? "—",
  }));

  const coincide = (offering, assignment) =>
    offering.docenteId === assignment.docenteId &&
    offering.asignaturaId === assignment.asignaturaId &&
    offering.grupoId === assignment.grupoId &&
    offering.periodoId === assignment.periodoId;

  const ofertas = db.offerings.filter((o) =>
    asignaciones.some((a) => coincide(o, a)),
  );

  const sesiones = db.sessions.filter((s) =>
    ofertas.some((o) => o.id === s.offeringId),
  );

  const stats = sesiones.map((s) => sessionStats(db, s.id));
  const total = stats.reduce((sum, s) => sum + s.total, 0);
  const presentes = stats.reduce((sum, s) => sum + s.presentes, 0);
  return {
    asignaciones: carga,
    ofertas,
    sesiones: sesiones.map((s) => enrichSession(db, s)),
    totalSesiones: sesiones.length,
    registros: total,
    pct: total ? Math.round((presentes / total) * 100) : 0,
    abiertas: sesiones.filter((s) => s.estado === "Abierta").length,
    pendientes: sesiones.filter((s) =>
      ["Borrador", "Programada"].includes(s.estado),
    ).length,
  };
}

/* Indicadores institucionales del dashboard administrativo. */
export function institutionMetrics(db) {
  const sesiones = db.sessions;
  const stats = sesiones.map((s) => sessionStats(db, s.id));
  const registros = stats.reduce((sum, s) => sum + s.total, 0);
  const presentes = stats.reduce((sum, s) => sum + s.presentes, 0);
  return {
    instituciones: activos(db.instituciones).length,
    facultades: activos(db.facultades).length,
    programas: activos(db.programas).length,
    planes: db.planesEstudio.filter((p) => p.estado === "Activo").length,
    asignaturas: activos(db.asignaturas).length,
    docentes: activos(db.docentes).length,
    estudiantes: estudiantesActivos(db.estudiantes).length,
    grupos: activos(db.grupos).length,
    representantes: activos(db.representantes).length,
    periodosActivos: db.periodos.filter((p) => p.estado === "ACTIVE").length,
    sesiones: sesiones.length,
    realizadas: sesiones.filter((s) =>
      ["Cerrada", "Validada", "Firmada"].includes(s.estado),
    ).length,
    abiertas: sesiones.filter((s) => s.estado === "Abierta").length,
    programadas: sesiones.filter((s) => s.estado === "Programada").length,
    borradores: sesiones.filter((s) => s.estado === "Borrador").length,
    pendientesFirma: sesiones.filter((s) => ["Cerrada", "Validada"].includes(s.estado))
      .length,
    registros,
    presentes,
    pct: registros ? Math.round((presentes / registros) * 100) : 0,
  };
}

/* Resumen académico: conteo de cada entidad del catálogo. Alimenta la
   sección "Resumen académico" del dashboard. */
export function resumenAcademico(db) {
  return [
    { label: "Instituciones", total: db.instituciones.length },
    { label: "Facultades", total: db.facultades.length },
    { label: "Programas", total: db.programas.length },
    { label: "Planes de estudio", total: db.planesEstudio.length },
    { label: "Niveles académicos", total: db.niveles.length },
    { label: "Asignaturas", total: db.asignaturas.length },
    { label: "Docentes", total: db.docentes.length },
    { label: "Estudiantes", total: db.estudiantes.length },
    { label: "Representantes", total: db.representantes.length },
    { label: "Grupos", total: db.grupos.length },
    { label: "Ofertas académicas", total: db.offerings.length },
    { label: "Sesiones", total: db.sessions.length },
    { label: "Registros de asistencia", total: db.records.length },
  ];
}

/* Niveles de un plan con sus asignaturas y configuración curricular. */
export function nivelesDePlan(db, planId) {
  const idx = indexCatalog(db);
  return db.niveles
    .filter((n) => n.planId === planId)
    .sort((a, b) => a.numero - b.numero)
    .map((nivel) => ({
      ...nivel,
      asignaturas: db.planAsignaturas
        .filter((link) => link.nivelId === nivel.id)
        .sort((a, b) => a.posicion - b.posicion)
        .map((link) => ({
          ...link,
          asignatura: idx.asignatura.get(link.asignaturaId)?.nombre ?? "—",
          codigo: idx.asignatura.get(link.asignaturaId)?.codigo ?? "—",
        })),
    }));
}

/* Prerrequisitos de una asignatura, con el nombre resuelto. */
export function prerrequisitosDe(db, asignaturaId) {
  const idx = indexCatalog(db);
  return db.subjectPrerequisites
    .filter((p) => p.asignaturaId === asignaturaId)
    .map((p) => ({
      ...p,
      prerrequisito: idx.asignatura.get(p.prerrequisitoId)?.nombre ?? "—",
      codigo: idx.asignatura.get(p.prerrequisitoId)?.codigo ?? "—",
    }));
}

/* Registros manuales: correcciones hechas por coordinación. */
export function registrosManuales(db) {
  return db.records.filter((r) => r.manual || r.metodo === "MANUAL");
}

/* Estado de las firmas por sesión: qué rol ya firmó y cuál falta. */
export function firmasPorSesion(db) {
  return db.sessions.map((s) => {
    const info = enrichSession(db, s);
    const firmas = db.sessionSignatures.filter((f) => f.sesionId === s.id);
    const docente = firmas.find((f) => f.rol === "Docente");
    const representante = firmas.find((f) => f.rol === "Representante");
    return {
      sesion: s,
      grupo: info.grupo,
      asignatura: info.asignatura,
      docente: docente?.estado ?? "Sin firma",
      representante: representante?.estado ?? "Sin firma",
    };
  });
}

/* Asistencia agrupada por la dimensión indicada. */
export function agrupar(db, dimension) {
  const buckets = new Map();
  db.sessions.forEach((session) => {
    const enriched = enrichSession(db, session);
    const key = enriched[dimension] ?? "—";
    if (!buckets.has(key)) {
      buckets.set(key, { label: key, total: 0, presentes: 0, sesiones: 0 });
    }
    const bucket = buckets.get(key);
    const stats = sessionStats(db, session.id);
    bucket.total += stats.total;
    bucket.presentes += stats.presentes;
    bucket.sesiones += 1;
  });
  return Array.from(buckets.values())
    .map((b) => ({ ...b, pct: b.total ? Math.round((b.presentes / b.total) * 100) : 0 }))
    .sort((a, b) => a.pct - b.pct);
}

/* Estudiantes en riesgo: asistencia bajo el umbral. */
export function estudiantesEnRiesgo(db, umbral = 75) {
  const totals = new Map();
  db.records.forEach((record) => {
    const current = totals.get(record.estudianteId) ?? { total: 0, presentes: 0 };
    current.total += 1;
    if (record.estado === "Presente") current.presentes += 1;
    totals.set(record.estudianteId, current);
  });
  return Array.from(totals.entries())
    .map(([estudianteId, t]) => ({
      estudiante: db.estudiantes.find((e) => e.id === estudianteId),
      total: t.total,
      presentes: t.presentes,
      pct: t.total ? Math.round((t.presentes / t.total) * 100) : 0,
    }))
    .filter((row) => row.estudiante && row.pct < umbral)
    .sort((a, b) => a.pct - b.pct);
}

/* Serie temporal por fecha para el gráfico de línea. */
export function tendencia(db) {
  const porFecha = new Map();
  db.sessions.forEach((session) => {
    const stats = sessionStats(db, session.id);
    const current = porFecha.get(session.fecha) ?? { label: session.fecha.slice(5), total: 0, presentes: 0 };
    current.total += stats.total;
    current.presentes += stats.presentes;
    porFecha.set(session.fecha, current);
  });
  return Array.from(porFecha.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      label: v.label,
      value: v.total ? Math.round((v.presentes / v.total) * 100) : 0,
      total: v.total,
    }));
}

/* Asistencia de un estudiante: total, por asignatura y riesgo.
   Es la fuente del panel de estudiante y del detalle del representante. */
export function asistenciaDeEstudiante(db, estudianteId, umbral = 75) {
  const registros = db.records.filter((r) => r.estudianteId === estudianteId);
  const porAsignatura = new Map();

  registros.forEach((record) => {
    const sesion = byId(db.sessions, record.sesionId);
    const offering = sesion ? byId(db.offerings, sesion.offeringId) : null;
    const asignaturaId = offering?.asignaturaId ?? "—";
    const actual = porAsignatura.get(asignaturaId) ?? {
      asignaturaId,
      asignatura: nombreDe(db.asignaturas, asignaturaId),
      total: 0,
      presentes: 0,
      ausentes: 0,
    };
    actual.total += 1;
    if (record.estado === "Presente") actual.presentes += 1;
    if (record.estado === "Ausente") actual.ausentes += 1;
    porAsignatura.set(asignaturaId, actual);
  });

  const total = registros.length;
  const presentes = registros.filter((r) => r.estado === "Presente").length;
  const detalle = Array.from(porAsignatura.values())
    .map((row) => ({
      ...row,
      pct: row.total ? Math.round((row.presentes / row.total) * 100) : 0,
    }))
    .sort((a, b) => a.pct - b.pct);

  return {
    total,
    presentes,
    ausentes: registros.filter((r) => r.estado === "Ausente").length,
    pendientes: registros.filter((r) => !["Presente", "Ausente"].includes(r.estado)).length,
    pct: total ? Math.round((presentes / total) * 100) : 0,
    detalle,
    enRiesgo: total > 0 && Math.round((presentes / total) * 100) < umbral,
    ultima: registros
      .map((r) => ({ ...r, fecha: byId(db.sessions, r.sesionId)?.fecha ?? "" }))
      .filter((r) => r.fecha)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))[0],
  };
}

export const ESTADOS_SESION = [
  "Borrador",
  "Programada",
  "Abierta",
  "Cerrada",
  "Validada",
  "Firmada",
];

export function tonoEstado(estado) {
  if (["Activo", "Activa", "Abierta", "Firmada", "ACTIVE", "NORMAL", "GRADUATED"].includes(estado))
    return "ok";
  if (["Programada", "Próximo", "PLANNED", "ELECTIVE"].includes(estado)) return "info";
  if (["Validada", "Borrador", "PRACTICE", "OTHER"].includes(estado)) return "warn";
  if (
    ["Inactivo", "Inactiva", "Cerrada", "Finalizado", "INACTIVE", "CLOSED", "CANCELLED", "WITHDRAWN"].includes(estado)
  )
    return "neutral";
  return "neutral";
}

/* Etiqueta de presentación para los estados del contrato (enums) y los
   estados en español. La UI nunca debe mostrar el código crudo. */
const ESTADO_LABELS = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  PLANNED: "Planificado",
  CLOSED: "Cerrado",
  CANCELLED: "Cancelado",
  WITHDRAWN: "Retirado",
  GRADUATED: "Graduado",
  NORMAL: "Normal",
  ELECTIVE: "Electiva",
  PRACTICE: "Práctica",
  OTHER: "Otro",
};

export function estadoLabel(estado) {
  return ESTADO_LABELS[estado] ?? estado;
}
