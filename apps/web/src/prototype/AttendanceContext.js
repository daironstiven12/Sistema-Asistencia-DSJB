"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import {
  addAudit,
  addManualRecord,
  createRecord,
  formatDisplayDate,
  missingFields,
  nextDraftId,
  registerStudent,
  setStatus,
  sign,
} from "@/lib/attendanceFlow";
import { attendanceDetails, attendances, students } from "@/data/asistencias";
import {
  activeAssignment,
  representative,
} from "@/data/representante";

const AttendanceContext = createContext(null);

const ROSTER_NAMES = students.map((s, i) => ({
  key: `seed-${i + 1}`,
  name: s.name,
  idNumber: s.id,
}));

function seedStudents(mode) {
  return ROSTER_NAMES.map((s, i) => {
    if (mode === "open") {
      const src = students[i];
      return {
        ...s,
        status: src.status,
        time: src.time,
        manual: false,
        method: src.status === "Presente" ? "Código" : null,
        sig: null,
      };
    }
    if (mode === "closed") {
      if (i < 6)
        return {
          ...s,
          status: "Presente",
          time: "2:05 PM",
          manual: false,
          method: "Código",
          sig: null,
        };
      if (i === 6)
        return { ...s, status: "Ausente", time: "—", manual: false, method: null, sig: null };
      return { ...s, status: "Pendiente", time: "—", manual: false, method: null, sig: null };
    }
    return { ...s, status: "Pendiente", time: "—", manual: false, method: null, sig: null };
  });
}

const SEED_DATES_ISO = {
  "ab-001": "2026-09-30",
  "prog-001": "2026-09-30",
  "prog-002": "2026-10-01",
  "prog-003": "2026-10-02",
  "bor-001": "2026-10-03",
  "cer-001": "2026-09-23",
  "cer-002": "2026-09-24",
  "hist-001": "2026-01-15",
};

function seedRecord(item) {
  const detail = attendanceDetails[item.id];
  const mode =
    item.status === "Abierta" ? "open" : item.status === "Cerrada" ? "closed" : "empty";
  const record = {
    id: item.id,
    faculty: "Facultad de Ingeniería",
    program: "Ingeniería de Telecomunicaciones e Informática",
    level: "VII semestre",
    subject: detail?.subject ?? item.subject,
    subjectCode: "SOP-701",
    period: item.period ?? activeAssignment.period,
    cds: "Grupo A",
    group: item.group,
    date: item.date.replace(/^Hoy · /, ""),
    dateISO: SEED_DATES_ISO[item.id] ?? "",
    startTime: item.time.split(" - ")[0] ?? item.time,
    endTime: item.time.split(" - ")[1] ?? "",
    teacher: detail?.teacher ?? "Docente asignado al grupo",
    topic: detail?.topic ?? "Temas de la sesión.",
    status: item.status,
    openedAt: item.status === "Abierta" ? "30/09/2026 14:05" : null,
    closedAt:
      item.status === "Cerrada" ? "30/09/2026 16:01" : null,
    students: seedStudents(mode),
    repSignature: null,
    teacherSignature: null,
    audit: [
      {
        at: "30/09/2026 14:02",
        actor: representative.role,
        action: "Representante creó la asistencia",
        detail: "",
      },
    ],
  };
  if (item.status === "Abierta") {
    record.audit.push({
      at: "30/09/2026 14:05",
      actor: representative.role,
      action: "Representante abrió la asistencia",
      detail: "",
    });
  }
  if (item.status === "Cerrada") {
    record.audit.push({
      at: "30/09/2026 16:01",
      actor: representative.role,
      action: "Representante cerró la asistencia",
      detail: "",
    });
  }
  return record;
}

function buildSeed() {
  return attendances.map(seedRecord);
}

/* Reloj mock: avanza unos minutos con cada acción registrada. */
function useMockClock() {
  const minutes = useRef(0);
  return useCallback(() => {
    minutes.current += 3;
    const total = 14 * 60 + 2 + minutes.current;
    const hh = String(Math.floor(total / 60)).padStart(2, "0");
    const mm = String(total % 60).padStart(2, "0");
    return `30/09/2026 ${hh}:${mm}`;
  }, []);
}

export function AttendanceProvider({ children }) {
  const [records, setRecords] = useState(buildSeed);
  const tick = useMockClock();

  const value = useMemo(() => {
    const getRecord = (id) => records.find((r) => r.id === id) ?? null;

    const stamp = (record, actor, action, detail) =>
      addAudit(record, tick(), actor, action, detail);

    return {
      records,
      getRecord,

      createDraft(form) {
        const id = nextDraftId();
        const record = stamp(
          {
            ...createRecord(form, id),
            /* El grupo y el período vienen de la asignación activa. */
            group: activeAssignment.group,
            period: activeAssignment.period,
            date: formatDisplayDate(form.date),
            dateISO: form.date,
          },
          representative.role,
          "Representante creó la asistencia",
          "",
        );
        setRecords((prev) => [record, ...prev]);
        return id;
      },

      updateDraft(id, patch) {
        setRecords((prev) =>
          prev.map((rec) => {
            if (rec.id !== id) return rec;
            const next = { ...rec, ...patch };
            if (patch.date && /^\d{4}-\d{2}-\d{2}$/.test(patch.date)) {
              next.date = formatDisplayDate(patch.date);
              next.dateISO = patch.date;
            }
            return next;
          }),
        );
      },

      schedule(id) {
        const rec = getRecord(id);
        if (!rec) return { ok: false, missing: [], message: "No existe." };
        const missing = missingFields(rec);
        if (missing.length > 0) return { ok: false, missing, message: "" };
        const moved = setStatus(rec, "Programada");
        if (!moved.ok) return { ok: false, missing: [], message: moved.message };
        setRecords((prev) =>
          prev.map((r) =>
            r.id === id
              ? stamp(moved.record, representative.role, "Representante programó la asistencia", "")
              : r,
          ),
        );
        return { ok: true, missing: [], message: "" };
      },

      open(id) {
        const rec = getRecord(id);
        if (!rec) return { ok: false, message: "No existe." };
        const moved = setStatus(rec, "Abierta");
        if (!moved.ok) return { ok: false, message: moved.message };
        const at = tick();
        setRecords((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...addAudit(
                    { ...moved.record, openedAt: at },
                    at,
                    representative.role,
                    "Representante abrió la asistencia",
                    "",
                  ),
                }
              : r,
          ),
        );
        return { ok: true, message: "" };
      },

      register(id, studentKey, options = {}) {
        const rec = getRecord(id);
        if (!rec) return { ok: false, message: "No existe." };
        const at = tick();
        const out = registerStudent(rec, studentKey, at, {
          method: options.method ?? null,
          signature: options.signature ?? null,
        });
        if (!out.ok) return out;
        const student = rec.students.find((s) => s.key === studentKey);
        const methodLabel = options.method ? `Método: ${options.method}` : "";
        setRecords((prev) =>
          prev.map((r) =>
            r.id === id
              ? addAudit(
                  out.record,
                  at,
                  student.name,
                  "Estudiante registrado",
                  methodLabel,
                )
              : r,
          ),
        );
        return { ok: true, message: "" };
      },

      close(id) {
        const rec = getRecord(id);
        if (!rec) return { ok: false, message: "No existe." };
        const moved = setStatus(rec, "Cerrada");
        if (!moved.ok) return { ok: false, message: moved.message };
        const at = tick();
        setRecords((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...addAudit(
                    { ...moved.record, closedAt: at },
                    at,
                    representative.role,
                    "Representante cerró la asistencia",
                    "",
                  ),
                }
              : r,
          ),
        );
        return { ok: true, message: "" };
      },

      addManual(id, { studentKey, status, justification }) {
        const rec = getRecord(id);
        if (!rec) return { ok: false, message: "No existe." };
        const at = tick();
        const out = addManualRecord(rec, {
          studentKey,
          status,
          justification,
          at,
          by: representative.role,
        });
        if (!out.ok) return out;
        const student = rec.students.find((s) => s.key === studentKey);
        setRecords((prev) =>
          prev.map((r) =>
            r.id === id
              ? addAudit(
                  out.record,
                  at,
                  representative.role,
                  "Representante agregó registro manual",
                  `${student.name}. Motivo: ${justification.trim()}`,
                )
              : r,
          ),
        );
        return { ok: true, message: "" };
      },

      validate(id) {
        const rec = getRecord(id);
        if (!rec) return { ok: false, message: "No existe." };
        const moved = setStatus(rec, "Validada");
        if (!moved.ok) return { ok: false, message: moved.message };
        setRecords((prev) =>
          prev.map((r) =>
            r.id === id
              ? stamp(moved.record, representative.role, "Representante validó la revisión", "")
              : r,
          ),
        );
        return { ok: true, message: "" };
      },

      sign(id, role, signature) {
        const rec = getRecord(id);
        if (!rec) return { ok: false, message: "No existe." };
        const out = sign(rec, role, signature);
        if (!out.ok) return out;
        const label =
          role === "docente" ? "Docente firmó el acta" : "Representante firmó el acta";
        const actor = role === "docente" ? "Docente" : representative.role;
        setRecords((prev) =>
          prev.map((r) => (r.id === id ? stamp(out.record, actor, label, "") : r)),
        );
        return { ok: true, message: "" };
      },
    };
  }, [records, tick]);

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error("useAttendance requiere AttendanceProvider.");
  return ctx;
}
