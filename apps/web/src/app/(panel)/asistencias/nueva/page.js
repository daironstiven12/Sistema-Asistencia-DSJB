"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, CheckCircle2, FileText, Lock, XCircle } from "lucide-react";
import modalStyles from "@/components/SessionModal.module.css";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import { ResultModal, SessionModal } from "@/components/SessionModal";
import { defectoPorEstado, mensajeAmigable } from "@/lib/errorAmigable";
import { attendanceApi } from "@/services/api/attendance";
import { ApiError } from "@/services/api/http";
import styles from "./page.module.css";

/* Creación real: POST /attendance/sessions. La oferta se elige de un
   selector alimentado por GET /attendance/offerings (solo ofertas del
   representante autenticado). Solo viajan los campos del DTO. */
const HORARIO_INVALIDO =
  "El horario no es válido. La hora de finalización debe ser posterior a la hora de inicio.";

function horarioValido(inicio, fin) {
  const a = String(inicio ?? "");
  const b = String(fin ?? "");
  if (!/^\d{2}:\d{2}$/.test(a) || !/^\d{2}:\d{2}$/.test(b)) return false;
  return a < b;
}
export default function NuevaAsistenciaPage() {
  const router = useRouter();
  const [ofertas, setOfertas] = useState([]);
  const [cargandoOfertas, setCargandoOfertas] = useState(true);
  const [errorOfertas, setErrorOfertas] = useState(null);
  const [form, setForm] = useState({
    courseOfferingId: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: "16:00",
    endTime: "18:00",
    topic: "",
  });
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [modal, setModal] = useState(null);
  const [creadaId, setCreadaId] = useState(null);

  useEffect(() => {
    let viva = true;
    attendanceApi
      .listOfferings()
      .then((rows) => {
        if (viva) {
          setOfertas(rows);
          if (rows.length === 1) {
            setForm((prev) => ({ ...prev, courseOfferingId: rows[0].courseOfferingId }));
          }
        }
      })
      .catch((e) => {
        if (viva) {
          setErrorOfertas(
            e instanceof ApiError
              ? e.message
              : "No se pudieron cargar las ofertas académicas.",
          );
        }
      })
      .finally(() => {
        if (viva) setCargandoOfertas(false);
      });
    return () => {
      viva = false;
    };
  }, []);

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  async function crear(event) {
    event.preventDefault();
    if (cargando) return;
    if (!form.courseOfferingId.trim() || !form.date || !form.startTime || !form.endTime) {
      setError("Indica la oferta académica, la fecha y el horario.");
      return;
    }
    /* Validación local antes de la petición: evita el 400/23514 del backend. */
    if (!horarioValido(form.startTime, form.endTime)) {
      setModal({ kind: "error", mensaje: HORARIO_INVALIDO });
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const sesion = await attendanceApi.create({
        courseOfferingId: form.courseOfferingId.trim(),
        sessionDate: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        topics: form.topic,
      });
      setCreadaId(sesion.id);
      setModal({
        kind: "exito",
        mensaje: "La asistencia fue creada correctamente.",
      });
    } catch (e) {
      const esHorario =
        e instanceof ApiError && e.status === 400 && /hora/i.test(String(e.message ?? ""));
      setModal({
        kind: "error",
        mensaje: esHorario
          ? HORARIO_INVALIDO
          : mensajeAmigable(
              e,
              e instanceof ApiError ? defectoPorEstado(e) : "No se pudo crear la asistencia.",
            ),
      });
      setCargando(false);
    }
  }

  return (
    <AppShell active="asistencias">
      <div className={styles.content}>
        <PageHeader
          title="Nueva asistencia"
          subtitle="Completa la información de la sesión antes de compartirla."
        />

        {error ? (
          <p className={styles.missing} role="alert">
            {error}
          </p>
        ) : null}

        <form className={styles.card} onSubmit={crear}>
          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>
              Oferta académica
            </legend>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="oferta">Oferta académica</label>
                <select
                  id="oferta"
                  value={form.courseOfferingId}
                  onChange={(e) => set("courseOfferingId", e.target.value)}
                  disabled={cargandoOfertas || ofertas.length === 0}
                  required
                >
                  <option value="">
                    {cargandoOfertas
                      ? "Cargando ofertas…"
                      : ofertas.length === 0
                        ? "Sin ofertas asignadas"
                        : "Selecciona la oferta"}
                  </option>
                  {ofertas.map((o) => (
                    <option key={o.courseOfferingId} value={o.courseOfferingId}>
                      {o.subject}
                      {o.subjectCode ? ` · ${o.subjectCode}` : ""} · {o.group}
                      {o.period ? ` · ${o.period}` : ""}
                      {o.level ? ` · ${o.level}` : ""}
                    </option>
                  ))}
                </select>
                {errorOfertas ? (
                  <p className={styles.missing} role="alert">
                    {errorOfertas}
                  </p>
                ) : null}
                {!cargandoOfertas && ofertas.length === 0 && !errorOfertas ? (
                  <p className={styles.locked}>
                    <Lock aria-hidden="true" />
                    No tienes ofertas académicas asignadas en este período.
                  </p>
                ) : (
                  <p className={styles.locked}>
                    <Lock aria-hidden="true" />
                    Solo tus ofertas asignadas. El grupo y la asignatura se
                    determinan desde la oferta elegida.
                  </p>
                )}
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
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="inicio">Hora de inicio</label>
                <input
                  id="inicio"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => set("startTime", e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="fin">Hora de finalización</label>
                <input
                  id="fin"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => set("endTime", e.target.value)}
                  required
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
              type="submit"
              className={styles.btnPrimary}
              disabled={cargando || cargandoOfertas || !form.courseOfferingId}
            >
              <CalendarCheck aria-hidden="true" />
              {cargando ? "Creando…" : "Crear asistencia"}
            </button>
          </div>
        </form>

        <p className={styles.hint}>
          <FileText aria-hidden="true" />
          La asistencia se crea en Borrador. Podrás abrirla desde su detalle
          para que los estudiantes se registren con el código.
        </p>
      </div>

      <SessionModal
        open={modal?.kind === "exito"}
        onClose={() => {
          setModal(null);
          setCargando(false);
        }}
        title="Acción completada"
        tone="success"
        icon={CheckCircle2}
        actions={
          <>
            <button
              type="button"
              className={modalStyles.btnSecondary}
              onClick={() => {
                setModal(null);
                setCargando(false);
              }}
            >
              Seguir aquí
            </button>
            <button
              type="button"
              data-autofocus
              className={modalStyles.btnPrimary}
              onClick={() => router.push(`/asistencias/${creadaId}`)}
            >
              Ver asistencia
            </button>
          </>
        }
      >
        <p>{modal?.mensaje ?? ""}</p>
      </SessionModal>
      <ResultModal
        open={modal?.kind === "error"}
        onClose={() => setModal(null)}
        tone="error"
        title="No fue posible completar la acción"
        message={modal?.mensaje ?? ""}
        actionLabel="Entendido"
        icon={XCircle}
      />
    </AppShell>
  );
}
