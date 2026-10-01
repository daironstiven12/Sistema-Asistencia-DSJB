"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { dataSource, COLLECTIONS } from "@/services";
import ui from "@/components/ui/ui.module.css";
import {
  enrichSession,
  institutionMetrics,
  docenteCarga,
  sessionStats,
  estudiantesEnRiesgo,
  agrupar,
  tendencia,
  byId,
  indexCatalog,
  asistenciaDeEstudiante,
} from "./selectors";
import { transicionarSesion, puedeTransicionar } from "./flowAdapter";

/* Estado académico global. Carga desde `services` (mock hoy, API mañana)
   y centraliza toda mutación con su registro de auditoría. */

const AcademyContext = createContext(null);

const ACTORES = {
  admin: { nombre: "Coordinación Académica", rol: "Administrador" },
  docente: { nombre: "Dr. Carlos Andrés Meza", rol: "Docente" },
  representante: { nombre: "Jeanpier Polanco", rol: "Representante" },
  estudiante: { nombre: "Laura Daniela Mena Palacios", rol: "Estudiante" },
};

/* Identificador legible por colección: prefijos alineados con el mock.
   Las claves son los nombres reales de `COLLECTIONS`, no traducciones. */
const PREFIJOS = {
  [COLLECTIONS.INSTITUCIONES]: "ins",
  [COLLECTIONS.PERSONAS]: "per",
  [COLLECTIONS.USUARIOS]: "usr",
  [COLLECTIONS.DOCENTES]: "doc",
  [COLLECTIONS.ESTUDIANTES]: "est",
  [COLLECTIONS.REPRESENTANTES]: "rep",
  [COLLECTIONS.ASIGNATURAS]: "asg",
  [COLLECTIONS.PERIODOS]: "per",
  [COLLECTIONS.PLANES]: "pla",
  [COLLECTIONS.PRERREQUISITOS]: "spr",
  [COLLECTIONS.FACULTADES]: "fac",
  [COLLECTIONS.PROGRAMAS]: "pro",
  [COLLECTIONS.NIVELES]: "niv",
  [COLLECTIONS.GRUPOS]: "gru",
  [COLLECTIONS.OFFERINGS]: "ofe",
  [COLLECTIONS.TEACHING]: "asi",
  [COLLECTIONS.REPRESENTATIVE_ASSIGNMENTS]: "rep",
  [COLLECTIONS.SESSIONS]: "ses",
  [COLLECTIONS.RECORDS]: "rec",
  [COLLECTIONS.FIRMAS]: "fir",
  [COLLECTIONS.RECORD_SIGNATURES]: "rsr",
  [COLLECTIONS.SESSION_SIGNATURES]: "sss",
  [COLLECTIONS.AUDIT]: "aud",
};

/* Prefijo por defecto cuando la colección no está en la tabla. */
function prefixOf(collection) {
  return PREFIJOS[collection] ?? collection.slice(0, 3);
}

/* Siguiente id de una colección: maximo correlativo + 1. `offset` permite
   generar varios ids en la misma operación sin que colisionen. */
function nextId(db, collection, offset = 0) {
  const prefix = prefixOf(collection);
  const max = (db[collection] ?? []).reduce((acc, item) => {
    const digits = String(item.id ?? "").match(/(\d+)\s*$/);
    return digits ? Math.max(acc, Number(digits[1])) : acc;
  }, 0);
  return `${prefix}-${String(max + 1 + offset).padStart(3, "0")}`;
}

function stamp(db, actor, modulo, accion, entidad, descripcion) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return {
    ...db,
    auditLogs: [
      {
        id: nextId(db, COLLECTIONS.AUDIT),
        usuario: actor.nombre,
        rol: actor.rol,
        accion,
        modulo,
        entidad,
        descripcion,
        fecha: now.toISOString().slice(0, 10),
        hora: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
      },
      ...db.auditLogs,
    ],
  };
}

export function AcademyProvider({ children }) {
  const [db, setDb] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    dataSource.load().then((data) => {
      if (!alive) return;
      setDb(data);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  /* Mutación genérica de colección. `log` describe la acción de auditoría.
     El actor se recibe por llamada para que cada rol firme con su nombre. */
  const mutate = useCallback((collection, operation, log, actorKey = "admin") => {
    setDb((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [collection]: operation(prev[collection], prev) };
      return log
        ? stamp(next, ACTORES[actorKey] ?? ACTORES.admin, log.modulo, log.accion, log.entidad ?? "", log.descripcion ?? "")
        : next;
    });
  }, []);

  const api = useMemo(() => {
    const add = (collection) => (entity, log, actorKey) =>
      mutate(collection, (list, prev) => [{ id: nextId(prev, collection), ...entity }, ...list], log, actorKey);

    const edit = (collection) => (id, patch, log, actorKey) =>
      mutate(
        collection,
        (list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        log,
        actorKey,
      );

    /* Activa/inactiva respetando la forma del estado de cada colección:
       "Activa" en asignaturasDocente, "Activo" en el resto. */
    const toggle = (collection) => (id, log, actorKey) =>
      mutate(
        collection,
        (list) =>
          list.map((item) => {
            if (item.id !== id) return item;
            const activo = item.estado === "Activo" || item.estado === "Activa";
            return {
              ...item,
              estado: activo
                ? item.estado === "Activa" ? "Inactiva" : "Inactivo"
                : item.estado === "Inactiva" ? "Activa" : "Activo",
            };
          }),
        log,
        actorKey,
      );

    const remove = (collection) => (id, log, actorKey) =>
      mutate(collection, (list) => list.filter((item) => item.id !== id), log, actorKey);

    return {
      /* ── Colecciones genéricas ─────────────────────────────── */
      add,
      edit,
      toggle,
      remove,

      /* ── Personas, usuarios y estudiantes ────────────────────
         Cada alta calcula sus ids desde el estado actual y devuelve
         las claves creadas, para que la pantalla pueda encadenar la
         siguiente escritura (persona → usuario → estudiante). */
      createPersonaConUsuario({ persona, rolId, estado = "Activo" }, actorKey) {
        const personaId = nextId(db, COLLECTIONS.PERSONAS);
        const usuarioId = nextId(db, COLLECTIONS.USUARIOS);
        setDb((prev) => {
          if (!prev) return prev;
          const nueva = { id: personaId, estado: "Activo", ...persona };
          const usuario = {
            id: usuarioId,
            personaId,
            usuario: persona.correo ?? "",
            rolId,
            ultimoAcceso: "—",
            estado,
          };
          const siguiente = {
            ...prev,
            personas: [nueva, ...prev.personas],
            usuarios: [usuario, ...prev.usuarios],
          };
          return stamp(
            siguiente,
            ACTORES[actorKey] ?? ACTORES.admin,
            "Usuarios",
            "Creó",
            persona.nombre ?? "",
            "Persona y cuenta de acceso registradas.",
          );
        });
        return { personaId, usuarioId };
      },

      createEstudiante({ persona, estudiante }, actorKey) {
        const personaId = nextId(db, COLLECTIONS.PERSONAS);
        const estudianteId = nextId(db, COLLECTIONS.ESTUDIANTES);
        setDb((prev) => {
          if (!prev) return prev;
          const nueva = { id: personaId, estado: "Activo", ...persona };
          const nuevo = { id: estudianteId, personaId, estado: "ACTIVE", ...estudiante };
          const siguiente = {
            ...prev,
            personas: [nueva, ...prev.personas],
            estudiantes: [nuevo, ...prev.estudiantes],
          };
          return stamp(
            siguiente,
            ACTORES[actorKey] ?? ACTORES.admin,
            "Estudiantes",
            "Matriculó",
            persona.nombre ?? "",
            "Estudiante registrado en el sistema.",
          );
        });
        return { personaId, estudianteId };
      },

      /* ── Asignación docente ──────────────────────────────────
         Escribe en dos colecciones: la asignación y la oferta de la
         asignatura en el grupo. Ambas se crean en el mismo ciclo para
         que no exista una asignación sin oferta. */
      createTeachingAssignment(payload, actorKey) {
        mutate(
          COLLECTIONS.TEACHING,
          (list, prev) => [
            { id: nextId(prev, COLLECTIONS.TEACHING), estado: "Activa", ...payload },
            ...list,
          ],
          { modulo: "Asignaciones", accion: "Asignó", descripcion: "Carga académica asignada a docente." },
          actorKey,
        );
        mutate(
          COLLECTIONS.OFFERINGS,
          (list, prev) => [
            {
              id: nextId(prev, COLLECTIONS.OFFERINGS),
              estado: "ACTIVE",
              ...payload,
            },
            ...list,
          ],
          null,
          actorKey,
        );
      },

      /* ── Oferta académica y periodos: máquinas de estado ────
         Cada entidad tiene sus propias transiciones; si se pide una no
         válida, la operación se rechaza y la entidad queda igual. */
      transitionOffering(id, to, actorKey) {
        const permitidas = {
          PLANNED: ["ACTIVE", "CANCELLED"],
          ACTIVE: ["CLOSED", "CANCELLED"],
          CLOSED: [],
          CANCELLED: [],
        };
        const oferta = db.offerings.find((o) => o.id === id);
        if (!oferta || !permitidas[oferta.estado]?.includes(to)) return;
        mutate(
          COLLECTIONS.OFFERINGS,
          (list) => list.map((o) => (o.id === id ? { ...o, estado: to } : o)),
          { modulo: "Oferta", accion: to, entidad: id, descripcion: `Oferta pasó a ${to}.` },
          actorKey,
        );
      },

      transitionPeriodo(id, to, actorKey) {
        const permitidas = { PLANNED: ["ACTIVE"], ACTIVE: ["CLOSED"], CLOSED: [] };
        const periodo = db.periodos.find((p) => p.id === id);
        if (!periodo || !permitidas[periodo.estado]?.includes(to)) return;
        mutate(
          COLLECTIONS.PERIODOS,
          (list) => list.map((p) => (p.id === id ? { ...p, estado: to } : p)),
          { modulo: "Periodos", accion: to, entidad: periodo.nombre, descripcion: `Periodo pasó a ${to}.` },
          actorKey,
        );
      },

      /* ── Sesiones de asistencia ───────────────────────────────
         La sesión y sus registros se escriben en un solo estado: si se
         hicieran en dos pasos, el segundo leería un estado todavía sin
         la sesión. `conMatricula` deja un registro por estudiante del
         grupo, para que el docente solo marque estados y no capture la
         lista cada vez. */
      createSession(payload, actorKey, conMatricula = true) {
        setDb((prev) => {
          if (!prev) return prev;
          const sesionId = nextId(prev, COLLECTIONS.SESSIONS);
          const sesion = { id: sesionId, estado: "Borrador", ...payload };
          const matriculados = conMatricula
            ? prev.estudiantes.filter(
                (e) => e.grupoId === payload.grupoId && e.estado === "ACTIVE",
              )
            : [];
          /* `offset` evita ids repetidos: todos los registros se crean en la
             misma operación, sobre el mismo estado previo. */
          const nuevos = matriculados.map((estudiante, i) => ({
            id: nextId(prev, COLLECTIONS.RECORDS, i),
            sesionId,
            estudianteId: estudiante.id,
            estado: "Pendiente",
            hora: "",
            manual: false,
            justificacion: "",
            firmaId: null,
            orden: i,
          }));
          const siguiente = {
            ...prev,
            sessions: [sesion, ...prev.sessions],
            records: [...nuevos, ...prev.records],
          };
          return stamp(
            siguiente,
            ACTORES[actorKey] ?? ACTORES.admin,
            "Asistencias",
            "Creó",
            payload.tema ?? sesionId,
            conMatricula
              ? "Sesión creada con la matrícula del grupo."
              : "Sesión de asistencia creada.",
          );
        });
      },

      /* Avanza o retrocede el estado respetando la máquina existente.
         Si la transición no es válida, la sesión queda igual. */
      transitionSession(id, to, actorKey) {
        mutate(
          COLLECTIONS.SESSIONS,
          (list) =>
            list.map((item) => {
              if (item.id !== id) return item;
              const moved = transicionarSesion(item, to);
              return moved.ok ? moved.sesion : item;
            }),
          { modulo: "Asistencias", accion: to, descripcion: `Estado cambiado a ${to}.` },
          actorKey,
        );
      },

      /* Registra la asistencia de un estudiante. Si ya existe fila, la
         actualiza; si no, la crea. Evita duplicados por doble clic. */
      registerStudent(sessionId, record, actorKey) {
        mutate(
          COLLECTIONS.RECORDS,
          (list, prev) => {
            const existente = list.find(
              (r) => r.sesionId === sessionId && r.estudianteId === record.estudianteId,
            );
            if (existente) {
              return list.map((r) => (r.id === existente.id ? { ...r, ...record } : r));
            }
            return [
              {
                id: nextId(prev, COLLECTIONS.RECORDS),
                sesionId: sessionId,
                manual: false,
                justificacion: "",
                firmaId: null,
                ...record,
              },
              ...list,
            ];
          },
          { modulo: "Asistencias", accion: "Registró", descripcion: `Registro de ${record.estado}.` },
          actorKey,
        );
      },

      saveSignature(signature, actorKey) {
        mutate(
          COLLECTIONS.FIRMAS,
          (list, prev) => [
            {
              id: nextId(prev, COLLECTIONS.FIRMAS),
              creadaEn: new Date().toISOString().slice(0, 10),
              vigente: true,
              ...signature,
            },
            ...list,
          ],
          { modulo: "Firmas", accion: "Guardó", descripcion: "Firma digital registrada." },
          actorKey,
        );
      },

      /* ── Configuración de la plataforma ──────────────────────
         Los ajustes viven en `db.config`: el administrador los cambia y
         el resto de módulos los leen del mismo estado. */
      updateConfig(patch, actorKey) {
        setDb((prev) => {
          if (!prev) return prev;
          const siguiente = { ...prev, config: { ...prev.config, ...patch } };
          return stamp(
            siguiente,
            ACTORES[actorKey] ?? ACTORES.admin,
            "Configuración",
            "Actualizó",
            "Preferencias",
            "Parámetros de la plataforma actualizados.",
          );
        });
      },

      /* ── Verificación de transición (reutiliza attendanceFlow) ─ */
      canGo: puedeTransicionar,
    };
  }, [mutate, db]);

  const view = useMemo(() => {
    if (!db) return null;
    const idx = indexCatalog(db);
    /* Lecturas de una fila. El nombre es autoexplicativo: antes se
       llamaba `session`, que chocaba con el término de dominio. */
    const leerSesion = (id) => {
      const fila = byId(db.sessions, id);
      return fila ? enrichSession(db, fila) : null;
    };
    return {
      db,
      config: db.config,
      /* Índices de lectura por id: evita buscar en la colección desde cada
         tabla. `index` es el nombre corto; `lookup` se conserva porque las
         vistas ya lo leen con ese nombre. */
      index: idx,
      lookup: idx,
      metrics: institutionMetrics(db),
      trend: tendencia(db),
      byPrograma: agrupar(db, "programa"),
      byAsignatura: agrupar(db, "asignatura"),
      byDocente: agrupar(db, "docente"),
      /* El umbral de riesgo sale de la configuración: si el administrador
         lo cambia, el dashboard y los reportes lo reflejan. */
      riesgo: (umbral) => estudiantesEnRiesgo(db, umbral ?? db.config?.umbralRiesgo ?? 75),
      leerSesion,
      resumenSesion: (id) => sessionStats(db, id),
      cargaDocente: (id) => docenteCarga(db, id),
      /* Asistencia de un estudiante, acumulada por grupo y asignatura. */
      asistenciaEstudiante: (estudianteId) => asistenciaDeEstudiante(db, estudianteId),
    };
  }, [db]);

  const value = useMemo(
    () => ({ ready, ...(view ?? {}), ...api }),
    [ready, view, api],
  );

  if (!ready) return <AcademySkeleton />;

  return <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>;
}

function AcademySkeleton() {
  return (
    <div className={ui.loader} role="status" aria-live="polite">
      <div style={{ position: "relative", width: 66, height: 66 }}>
        <div
          className={ui.loaderSpin}
          style={{ position: "absolute", inset: 0, width: 66, height: 66 }}
          aria-hidden="true"
        />
        <div className={ui.loaderMark} style={{ position: "absolute", inset: 11 }} aria-hidden="true">
          UT
        </div>
      </div>
      <p className={ui.loaderText}>Cargando estructura académica…</p>
    </div>
  );
}

export function useAcademy() {
  const ctx = useContext(AcademyContext);
  if (!ctx) throw new Error("useAcademy requiere AcademyProvider.");
  return ctx;
}
