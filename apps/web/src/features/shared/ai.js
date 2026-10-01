/* Módulo de IA: análisis sobre el estado ya calculado. Sin llamadas de
   red: los resultados se derivan de los datos locales y quedan
   encapsulados aquí para poder sustituirlos por un endpoint. */

import { agrupar, estudiantesEnRiesgo } from "@/features/shared/selectors";

const UMBRAL = 75;

const PROMPT_SUGERIDO =
  "Genera un informe de asistencia del grupo VII-A del periodo 2026-2, destacando estudiantes por debajo del 75% y patrones de ausentismo por día de la semana.";

export function ejecutarAnalisis(db, pregunta) {
  const metricas = resumen(db);
  const riesgos = estudiantesEnRiesgo(db, UMBRAL);
  const porPrograma = agrupar(db, "programa");
  const peorPrograma = porPrograma[0];

  const titulo = riesgoTitulo(riesgos.length);
  const listaRecomendaciones = recomendaciones(db, riesgos, peorPrograma);

  return {
    pregunta: pregunta?.trim() || PROMPT_SUGERIDO,
    titulo,
    metricas,
    hallazgos: hallazgos(db, riesgos, peorPrograma),
    recomendaciones: listaRecomendaciones,
    generadoEn: new Date().toISOString().slice(0, 16).replace("T", " "),
  };
}

function resumen(db) {
  const registros = db.records.length;
  const presentes = db.records.filter((r) => r.estado === "Presente").length;
  return {
    registros,
    presentes,
    pct: registros ? Math.round((presentes / registros) * 100) : 0,
    sesiones: db.sessions.length,
    estudiantes: db.estudiantes.length,
  };
}

function riesgoTitulo(cantidad) {
  if (cantidad === 0) return "Sin estudiantes en riesgo de asistencia";
  if (cantidad <= 3) return `${cantidad} estudiantes requieren seguimiento`;
  return `${cantidad} estudiantes en riesgo requieren intervención`;
}

function hallazgos(db, riesgos, peorPrograma) {
  const lista = [];

  if (riesgos.length > 0) {
    const criticos = riesgos.filter((r) => r.pct < 60);
    lista.push({
      titulo: `${riesgos.length} estudiantes bajo el ${UMBRAL}%`,
      detalle: criticos.length
        ? `${criticos.length} de ellos por debajo del 60%, lo que normalmente indica un problema de asistencia crónica y no ausencia puntual.`
        : "Ninguno en rango crítico; todos están en el rango de seguimiento.",
    });
  } else {
    lista.push({
      titulo: "Ningún estudiante bajo el umbral",
      detalle: "La asistencia del periodo se mantiene dentro del rango esperado para todos los estudiantes.",
    });
  }

  if (peorPrograma) {
    lista.push({
      titulo: `${peorPrograma.label} con menor asistencia`,
      detalle: `Registra ${peorPrograma.pct}% de presencia sobre ${peorPrograma.total} registros. Conviene revisar la carga de sesiones del programa.`,
    });
  }

  const sinRegistrar = db.sessions.filter((s) =>
    ["Borrador", "Programada"].includes(s.estado),
  );
  if (sinRegistrar.length > 0) {
    lista.push({
      titulo: `${sinRegistrar.length} sesiones sin registro`,
      detalle: "Hay sesiones en borrador o programadas que todavía no tienen registros de asistencia.",
    });
  }

  const firmadas = db.sessions.filter((s) => s.estado === "Firmada").length;
  lista.push({
    titulo: `${firmadas} de ${db.sessions.length} sesiones firmadas`,
    detalle:
      firmadas === db.sessions.length
        ? "Todo el periodo queda cerrado con soporte firmado."
        : "El acta sigue abierta para las sesiones pendientes de firma.",
  });

  return lista;
}

function recomendaciones(db, riesgos, peorPrograma) {
  const lista = [];

  if (riesgos.length) {
    lista.push({
      prioridad: "Alta",
      accion: "Notificar a los representantes de los estudiantes en riesgo",
      detalle: "Enviar el acumulado individual con el porcentaje y las fechas de ausencia más recientes.",
    });
  }

  if (peorPrograma) {
    lista.push({
      prioridad: "Media",
      accion: `Revisar la operación de ${peorPrograma.label}`,
      detalle: "Comparar número de sesiones impartidas frente a las programadas y verificar si hubo ausencias justificadas.",
    });
  }

  const abiertas = db.sessions.filter((s) => s.estado === "Abierta").length;
  if (abiertas > 0) {
    lista.push({
      prioridad: "Media",
      accion: "Cerrar las sesiones abiertas",
      detalle: `Hay ${abiertas} sesión(es) abierta(s). Mientras sigan abiertas no pueden validarse ni firmarse.`,
    });
  }

  lista.push({
    prioridad: "Baja",
    accion: "Exportar el acta del periodo",
    detalle: "Generar el PDF firmado una vez las sesiones queden en estado Firmada.",
  });

  return lista;
}

/* Consultas rápidas: reconocen las preguntas sugeridas y devuelven
   datos estructurados en lugar de texto genérico. Si no reconocen la
   pregunta, devuelven null y la pantalla usa el análisis completo. */
export function consultaRapida(db, pregunta) {
  const texto = pregunta?.trim().toLowerCase() ?? "";

  if (texto.includes("asignatura") && (texto.includes("menor") || texto.includes("baja"))) {
    const porAsignatura = agrupar(db, "asignatura").slice(0, 5);
    return {
      titulo: "Asignaturas con menor asistencia",
      filas: porAsignatura.map((a) => ({
        label: a.label,
        value: a.pct,
        display: `${a.pct}%`,
        detalle: `${a.sesiones} sesiones · ${a.total} registros`,
      })),
    };
  }

  if (texto.includes("sesiones") && (texto.includes("cuántas") || texto.includes("cuantas") || texto.includes("realizaron") || texto.includes("realizadas"))) {
    const realizadas = db.sessions.filter((s) =>
      ["Cerrada", "Validada", "Firmada"].includes(s.estado),
    ).length;
    return {
      titulo: "Sesiones realizadas en el periodo",
      filas: [
        { label: "Realizadas", value: realizadas, display: String(realizadas) },
        { label: "Totales", value: db.sessions.length, display: String(db.sessions.length) },
      ],
    };
  }

  if (texto.includes("grupo") && texto.includes("manual")) {
    const porGrupo = new Map();
    db.records.forEach((r) => {
      if (!r.manual) return;
      const sesion = db.sessions.find((s) => s.id === r.sesionId);
      if (!sesion) return;
      porGrupo.set(sesion.grupoId, (porGrupo.get(sesion.grupoId) ?? 0) + 1);
    });
    const filas = Array.from(porGrupo.entries())
      .map(([grupoId, total]) => ({
        label: db.grupos.find((g) => g.id === grupoId)?.nombre ?? "—",
        value: total,
        display: String(total),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    return { titulo: "Grupos con más registros manuales", filas };
  }

  if (texto.includes("resume") || texto.includes("resumen") || texto.includes("periodo actual")) {
    const registros = db.records.length;
    const presentes = db.records.filter((r) => r.estado === "Presente").length;
    const pct = registros ? Math.round((presentes / registros) * 100) : 0;
    return {
      titulo: "Resumen de la asistencia del periodo",
      filas: [
        { label: "Asistencia", value: pct, display: `${pct}%` },
        { label: "Registros", value: registros, display: registros.toLocaleString("es-CO") },
        { label: "Presentes", value: presentes, display: presentes.toLocaleString("es-CO") },
        { label: "Sesiones", value: db.sessions.length, display: String(db.sessions.length) },
        { label: "Estudiantes", value: db.estudiantes.length, display: String(db.estudiantes.length) },
      ],
    };
  }

  return null;
}

export { UMBRAL, PROMPT_SUGERIDO };
