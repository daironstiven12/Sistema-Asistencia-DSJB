"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, CheckCircle2, FileText, Lock, Save } from "lucide-react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import { useAttendance } from "@/prototype/AttendanceContext";
import { activeAssignment } from "@/data/representante";
import styles from "./page.module.css";

const EMPTY_FORM = {
  faculty: "Facultad de Ingeniería",
  program: "Ingeniería de Telecomunicaciones e Informática",
  level: "VII semestre",
  subject: "",
  subjectCode: "",
  period: activeAssignment.period,
  cds: "Grupo A",
  group: activeAssignment.group,
  date: "2026-09-30",
  startTime: "16:00",
  endTime: "18:00",
  teacher: "",
  topic: "",
};

const FIELD_LABELS = {
  faculty: "Facultad",
  program: "Programa",
  level: "Nivel",
  subject: "Asignatura",
  subjectCode: "Código de asignatura",
  period: "Periodo académico",
  cds: "CDS",
  group: "Grupo",
  date: "Fecha",
  startTime: "Hora de inicio",
  endTime: "Hora de finalización",
  teacher: "Docente",
  topic: "Temas tratados",
};

/* Preparación funcional de una asistencia con estado del prototipo. */
export default function NuevaAsistenciaPage() {
  const { createDraft, updateDraft, schedule } = useAttendance();
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [draftId, setDraftId] = useState(null);
  const [missing, setMissing] = useState([]);

  function set(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (draftId) updateDraft(draftId, { [key]: value });
      return next;
    });
    setMissing((prev) => prev.filter((k) => k !== key));
  }

  function saveDraft() {
    if (!draftId) {
      const id = createDraft(form);
      setDraftId(id);
    } else {
      updateDraft(draftId, form);
    }
  }

  function scheduleNow() {
    let id = draftId;
    if (!id) {
      id = createDraft(form);
      setDraftId(id);
    } else {
      updateDraft(id, form);
    }
    const result = schedule(id);
    if (!result.ok) {
      setMissing(result.missing);
      return;
    }
    router.push(`/asistencias/${id}`);
  }

  return (
    <AppShell active="asistencias">
      <div className={styles.content}>
        <PageHeader
          title="Nueva asistencia"
          subtitle="Completa la información de la sesión antes de compartirla."
        />

        {draftId && (
          <p className={styles.saved} role="status">
            <CheckCircle2 aria-hidden="true" />
            Borrador guardado ({draftId}). Ya aparece en Asistencias y puedes
            seguir editándolo aquí.
          </p>
        )}

        {missing.length > 0 && (
          <p className={styles.missing} role="alert">
            Completa los campos requeridos:{" "}
            {missing.map((k) => FIELD_LABELS[k]).join(", ")}.
          </p>
        )}

        <form
          className={styles.card}
          onSubmit={(event) => event.preventDefault()}
        >
          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>
              Información académica
            </legend>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="facultad">Facultad</label>
                <select
                  id="facultad"
                  value={form.faculty}
                  onChange={(e) => set("faculty", e.target.value)}
                >
                  <option value="Facultad de Ingeniería">
                    Facultad de Ingeniería
                  </option>
                  <option value="Facultad de Ciencias">
                    Facultad de Ciencias
                  </option>
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="programa">Programa</label>
                <select
                  id="programa"
                  value={form.program}
                  onChange={(e) => set("program", e.target.value)}
                >
                  <option value="Ingeniería de Telecomunicaciones e Informática">
                    Ingeniería de Telecomunicaciones e Informática
                  </option>
                  <option value="Ingeniería de Sistemas">
                    Ingeniería de Sistemas
                  </option>
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="nivel">Nivel</label>
                <select
                  id="nivel"
                  value={form.level}
                  onChange={(e) => set("level", e.target.value)}
                >
                  <option value="VII semestre">VII semestre</option>
                  <option value="VI semestre">VI semestre</option>
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="asignatura">Asignatura</label>
                <input
                  id="asignatura"
                  type="text"
                  value={form.subject}
                  onChange={(e) => set("subject", e.target.value)}
                  placeholder="Ej. Sistemas Operativos"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="codigo">Código de asignatura</label>
                <input
                  id="codigo"
                  type="text"
                  value={form.subjectCode}
                  onChange={(e) => set("subjectCode", e.target.value)}
                  placeholder="Ej. SOP-701"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="periodo">Periodo académico</label>
                <input
                  id="periodo"
                  type="text"
                  value={form.period}
                  readOnly
                  aria-readonly="true"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="cds">CDS</label>
                <select
                  id="cds"
                  value={form.cds}
                  onChange={(e) => set("cds", e.target.value)}
                >
                  <option value="Grupo A">Grupo A</option>
                  <option value="Grupo B">Grupo B</option>
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>
              Información de la sesión
            </legend>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="fecha">Fecha</label>
                <input
                  id="fecha"
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="inicio">Hora de inicio</label>
                <input
                  id="inicio"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => set("startTime", e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="fin">Hora de finalización</label>
                <input
                  id="fin"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => set("endTime", e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="grupo">Grupo asignado</label>
                <input
                  id="grupo"
                  type="text"
                  value={`${form.group} · Período ${form.period}`}
                  readOnly
                  aria-readonly="true"
                />
                <p className={styles.locked}>
                  <Lock aria-hidden="true" />
                  Determinado por tu asignación: no puedes crear asistencias
                  para otro grupo.
                </p>
              </div>
              <div className={styles.field}>
                <label htmlFor="docente">Docente</label>
                <input
                  id="docente"
                  type="text"
                  value={form.teacher}
                  onChange={(e) => set("teacher", e.target.value)}
                  placeholder="Nombre y apellidos del docente"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>Temas tratados</legend>
            <div className={styles.field}>
              <label htmlFor="temas">Descripción de los temas</label>
              <textarea
                id="temas"
                rows={4}
                value={form.topic}
                onChange={(e) => set("topic", e.target.value)}
                placeholder="Temas que se tratarán en la sesión"
              />
            </div>
          </fieldset>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={saveDraft}
            >
              <Save aria-hidden="true" />
              Guardar borrador
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={scheduleNow}
            >
              <CalendarCheck aria-hidden="true" />
              Programar asistencia
            </button>
          </div>
        </form>

        <p className={styles.hint}>
          <FileText aria-hidden="true" />
          Mientras esté programada, los estudiantes no podrán registrarse hasta
          que abras la asistencia.
        </p>
      </div>
    </AppShell>
  );
}
