"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  FileCheck,
  Lock,
  PenLine,
  QrCode,
  ScanLine,
  ShieldAlert,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import QrPlaceholder from "@/components/QrPlaceholder";
import SignaturePad from "@/components/SignaturePad";
import StatusBadge from "@/components/StatusBadge";
import { useAttendance } from "@/prototype/AttendanceContext";
import { isActiveRecord } from "@/lib/attendanceFlow";
import { activeAssignment } from "@/data/representante";
import { SHARE_CODE } from "@/data/asistencias";
import styles from "./AttendanceDetail.module.css";

const studentTone = {
  Presente: styles.tonePresent,
  Pendiente: styles.tonePending,
  Ausente: styles.toneAbsent,
};

function SignatureImage({ signature, alt }) {
  if (!signature) return null;
  if (signature.kind === "typed") {
    return <span className={styles.sigTyped}>{signature.data}</span>;
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={signature.data} alt={alt} className={styles.sigImg} />
  );
}

/* Detalle funcional de una asistencia con estado del prototipo. */
export default function AttendanceDetail({ id }) {
  const {
    getRecord,
    open,
    register,
    close,
    addManual,
    validate,
    sign,
    schedule,
  } = useAttendance();
  const detail = getRecord(id);

  const [qrOpen, setQrOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [simulateKey, setSimulateKey] = useState("");
  const [notice, setNotice] = useState(null);
  const [manualForm, setManualForm] = useState({
    studentKey: "",
    status: "Presente",
    justification: "",
  });

  if (!detail) {
    return (
      <AppShell active="asistencias">
        <div className={styles.content}>
          <PageHeader
            title="Asistencia no encontrada"
            subtitle="El registro mock no existe en esta sesión."
          />
          <Link href="/asistencias" className={styles.btnSecondary}>
            Volver a asistencias
          </Link>
        </div>
      </AppShell>
    );
  }

  const isDraft = detail.status === "Borrador";
  const isScheduled = detail.status === "Programada";
  const isOpen = detail.status === "Abierta";
  const isClosed = detail.status === "Cerrada";
  const isValidated = detail.status === "Validada";
  const isSigned = detail.status === "Firmada";
  const closedDone = isClosed || isValidated || isSigned;
  const operational = isActiveRecord(detail, activeAssignment);

  const presentCount = detail.students.filter(
    (s) => s.status === "Presente",
  ).length;
  const pendingStudents = detail.students.filter(
    (s) => s.status !== "Presente",
  );

  function flash(message, tone) {
    setNotice({ message, tone });
    window.setTimeout(() => setNotice(null), 4000);
  }

  function doOpen() {
    const result = open(id);
    setOpenConfirm(false);
    flash(
      result.ok
        ? "Asistencia abierta. Acepta registros mediante QR o código."
        : result.message,
      result.ok ? "ok" : "error",
    );
  }
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(SHARE_CODE);
    } catch {
      /* Portapapeles no disponible en el prototipo. */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function doSimulate() {
    if (!simulateKey) return;
    const result = register(id, simulateKey, { method: "Código" });
    if (!result.ok) {
      flash(result.message, "error");
      return;
    }
    setSimulateKey("");
    flash("Registro simulado correctamente.", "ok");
  }

  function doManual() {
    const result = addManual(id, manualForm);
    if (!result.ok) {
      flash(result.message, "error");
      return;
    }
    setManualOpen(false);
    setManualForm({ studentKey: "", status: "Presente", justification: "" });
    flash("Registro manual agregado con justificación.", "ok");
  }

  function doClose() {
    const result = close(id);
    setCloseOpen(false);
    if (!result.ok) {
      flash(result.message, "error");
      return;
    }
    flash("Asistencia cerrada correctamente.", "ok");
  }

  function doValidate() {
    const result = validate(id);
    flash(
      result.ok ? "Revisión validada. Ya puedes firmar." : result.message,
      result.ok ? "ok" : "error",
    );
  }

  function doSign(role, signature) {
    const result = sign(id, role, signature);
    if (!result.ok) {
      flash(result.message, "error");
      return;
    }
    flash(
      role === "docente"
        ? "Firma del docente cargada."
        : "Firma del representante registrada.",
      "ok",
    );
  }

  return (
    <AppShell active="asistencias">
      <div className={styles.content}>
        <PageHeader
          title={detail.subject}
          subtitle={`${detail.group} · ${detail.date} · ${detail.startTime}${detail.endTime ? ` - ${detail.endTime}` : ""}`}
        />

        {notice && (
          <p
            className={`${styles.notice} ${notice.tone === "error" ? styles.noticeError : styles.noticeOk}`}
            role="status"
          >
            {notice.tone === "error" ? (
              <AlertTriangle aria-hidden="true" />
            ) : (
              <CheckCircle2 aria-hidden="true" />
            )}
            {notice.message}
          </p>
        )}

        {isOpen && (
          <p className={styles.openStrip} role="status">
            <span className={styles.liveDot} aria-hidden="true" />
            <strong>ASISTENCIA ABIERTA</strong>
            <span>
              Los estudiantes pueden registrarse mediante QR o código.
            </span>
            <b className={styles.openCount}>
              {presentCount} / {detail.students.length}
            </b>
          </p>
        )}

        {!operational && (
          <p className={styles.historyBanner} role="note">
            <ShieldAlert aria-hidden="true" />
            Registro histórico del período {detail.period}: solo consulta. No
            puedes gestionar asistencias ni modificar registros.
          </p>
        )}

        <div className={styles.grid}>
          <div className={styles.main}>
            <section className={styles.card} aria-labelledby="info-title">
              <div className={styles.cardHead}>
                <h2 id="info-title" className={styles.cardTitle}>
                  Información de la sesión
                </h2>
                <StatusBadge status={detail.status} />
              </div>
              <dl className={styles.meta}>
                <div className={styles.metaItem}>
                  <dt>
                    <Users aria-hidden="true" />
                    Grupo
                  </dt>
                  <dd>{detail.group}</dd>
                </div>
                <div className={styles.metaItem}>
                  <dt>
                    <CalendarDays aria-hidden="true" />
                    Fecha
                  </dt>
                  <dd>{detail.date}</dd>
                </div>
                <div className={styles.metaItem}>
                  <dt>
                    <Clock aria-hidden="true" />
                    Hora
                  </dt>
                  <dd>
                    {detail.startTime}
                    {detail.endTime ? ` - ${detail.endTime}` : ""}
                  </dd>
                </div>
                <div className={styles.metaItem}>
                  <dt>
                    <CalendarDays aria-hidden="true" />
                    Período
                  </dt>
                  <dd>{detail.period}</dd>
                </div>
                <div className={styles.metaItem}>
                  <dt>
                    <User aria-hidden="true" />
                    Docente
                  </dt>
                  <dd>{detail.teacher}</dd>
                </div>
              </dl>
              <p className={styles.topic}>
                <strong>Temas tratados:</strong> {detail.topic}
              </p>
              <div className={styles.progressRow}>
                <div className={styles.progressTrack}>
                  <i
                    className={styles.progressFill}
                    style={{
                      width: `${detail.students.length ? Math.round((presentCount / detail.students.length) * 100) : 0}%`,
                    }}
                  />
                </div>
                <b className={styles.progressText}>
                  {presentCount} / {detail.students.length} estudiantes
                </b>
              </div>
            </section>

            <section className={styles.card} aria-labelledby="students-title">
              <div className={styles.cardHead}>
                <h2 id="students-title" className={styles.cardTitle}>
                  Registro de estudiantes
                </h2>
                <span className={styles.count}>
                  {detail.students.length} registros
                </span>
              </div>

              {closedDone && !isSigned && (
                <div className={styles.blocked}>
                  <Lock aria-hidden="true" />
                  <div>
                    <strong>Asistencia cerrada</strong>
                    <p>
                      El periodo de registro mediante QR y código ya finalizó.
                      Solo es posible un registro manual autorizado.
                    </p>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => setManualOpen(true)}
                    >
                      <UserPlus aria-hidden="true" />
                      Registro manual autorizado
                    </button>
                  </div>
                </div>
              )}

              {isOpen && (
                <div className={styles.simulate}>
                  <div className={styles.simulateField}>
                    <label htmlFor="simulate-student">
                      Simular registro de estudiante
                    </label>
                    <select
                      id="simulate-student"
                      value={simulateKey}
                      onChange={(e) => setSimulateKey(e.target.value)}
                    >
                      <option value="">Seleccionar estudiante</option>
                      {pendingStudents.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.name} · {s.status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    disabled={!simulateKey}
                    onClick={doSimulate}
                  >
                    <UserPlus aria-hidden="true" />
                    Registrar
                  </button>
                </div>
              )}

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">No.</th>
                      <th scope="col">Estudiante</th>
                      <th scope="col">Identificación</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Hora de registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.students.map((row, index) => (
                      <tr key={row.key}>
                        <td data-label="No.">{index + 1}</td>
                        <td data-label="Estudiante">
                          {row.name}
                          {row.manual && (
                            <span className={styles.manualTag}>
                              Registro manual
                            </span>
                          )}
                        </td>
                        <td data-label="Identificación">{row.idNumber}</td>
                        <td data-label="Estado">
                          <span
                            className={`${styles.pill} ${studentTone[row.status]}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td data-label="Hora de registro">{row.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {closedDone && (
              <section className={styles.card} aria-labelledby="audit-title">
                <div className={styles.cardHead}>
                  <h2 id="audit-title" className={styles.cardTitle}>
                    Historial de actividad
                  </h2>
                </div>
                <ol className={styles.audit}>
                  {detail.audit.map((entry, index) => (
                    <li key={index} className={styles.auditItem}>
                      <span className={styles.auditTime}>{entry.at}</span>
                      <div>
                        <strong>{entry.action}</strong>
                        <small>
                          {entry.actor}
                          {entry.detail ? ` · ${entry.detail}` : ""}
                        </small>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          <aside className={styles.side} aria-label="Acciones de la asistencia">
            <section className={styles.card} aria-labelledby="actions-title">
              <h2 id="actions-title" className={styles.cardTitle}>
                Acciones
              </h2>
              <div className={styles.actionList}>
                {operational && isDraft && (
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={() => {
                      const result = schedule(id);
                      flash(
                        result.ok
                          ? "Asistencia programada."
                          : `Faltan campos: ${result.missing.join(", ")}`,
                        result.ok ? "ok" : "error",
                      );
                    }}
                  >
                    <BadgeCheck aria-hidden="true" />
                    Programar asistencia
                  </button>
                )}
                {operational && isScheduled && (
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={() => setOpenConfirm(true)}
                  >
                    <ScanLine aria-hidden="true" />
                    Abrir asistencia
                  </button>
                )}
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setQrOpen(true)}
                  disabled={!isOpen && !closedDone}
                  title={
                    isOpen
                      ? "Mostrar QR"
                      : "Ver QR histórico (ya no acepta registros)"
                  }
                >
                  <QrCode aria-hidden="true" />
                  Ver QR
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setCodeOpen(true)}
                  disabled={!isOpen && !closedDone}
                  title={
                    isOpen
                      ? "Mostrar código manual"
                      : "Ver código histórico (ya no acepta registros)"
                  }
                >
                  <Copy aria-hidden="true" />
                  Ver código
                </button>
                {operational && isOpen && (
                  <button
                    type="button"
                    className={styles.btnDangerGhost}
                    onClick={() => setCloseOpen(true)}
                  >
                    <Lock aria-hidden="true" />
                    Cerrar asistencia
                  </button>
                )}
                {operational && (isClosed || isValidated) && (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => setManualOpen(true)}
                  >
                    <UserPlus aria-hidden="true" />
                    Agregar registro manual
                  </button>
                )}
                {isSigned && (
                  <Link
                    href={`/asistencias/${id}/acta`}
                    className={styles.btnPrimary}
                  >
                    <FileCheck aria-hidden="true" />
                    Generar acta
                  </Link>
                )}
              </div>
              {isClosed && (
                <p className={styles.correctionNote}>
                  <ShieldAlert aria-hidden="true" />
                  Los registros posteriores al cierre requieren autorización y
                  justificación. No existe registro normal de estudiantes.
                </p>
              )}
            </section>

            {closedDone && (
              <section className={styles.card} aria-labelledby="sign-title">
                <h2 id="sign-title" className={styles.cardTitle}>
                  Firmas
                </h2>
                {operational && isClosed && (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={doValidate}
                  >
                    <BadgeCheck aria-hidden="true" />
                    Revisar y validar
                  </button>
                )}
                <div className={styles.signBlock}>
                  <div className={styles.signHead}>
                    <h3>Firma del representante</h3>
                    <StatusBadge
                      status={detail.repSignature ? "Firmada" : "Pendiente"}
                    />
                  </div>
                  {detail.repSignature ? (
                    <SignatureImage
                      signature={detail.repSignature}
                      alt="Firma del representante"
                    />
                  ) : operational ? (
                    <SignaturePad
                      name="Jeanpier Polanco"
                      onConfirm={(sig) => doSign("representante", sig)}
                    />
                  ) : (
                    <p className={styles.loadedNote}>
                      Firma del representante pendiente.
                    </p>
                  )}
                </div>
                <div className={styles.signBlock}>
                  <div className={styles.signHead}>
                    <h3>Firma del docente</h3>
                    <StatusBadge
                      status={detail.teacherSignature ? "Firmada" : "Pendiente"}
                    />
                  </div>
                  {detail.teacherSignature ? (
                    <div>
                      <SignatureImage
                        signature={detail.teacherSignature}
                        alt="Firma del docente"
                      />
                      <p className={styles.loadedNote}>
                        <CheckCircle2 aria-hidden="true" />
                        Firma del docente cargada. Esta firma corresponde al
                        docente y fue proporcionada para el acta.
                      </p>
                    </div>
                  ) : operational ? (
                    <div>
                      <SignaturePad
                        name="docente"
                        mode="upload"
                        onConfirm={(sig) => doSign("docente", sig)}
                      />
                      <p className={styles.loadedNote}>
                        Cargar firma del docente: selecciona la imagen de firma
                        proporcionada para el acta.
                      </p>
                    </div>
                  ) : (
                    <p className={styles.loadedNote}>
                      Firma del docente pendiente.
                    </p>
                  )}
                </div>
                {!isSigned && (
                  <p className={styles.correctionNote}>
                    <PenLine aria-hidden="true" />
                    Se requieren ambas firmas sobre la asistencia validada para
                    generar el acta.
                  </p>
                )}
              </section>
            )}
          </aside>
        </div>

        {openConfirm && (
          <div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="open-title"
            onClick={() => setOpenConfirm(false)}
          >
            <div
              className={styles.modal}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.modalHead}>
                <h2 id="open-title">¿Abrir asistencia?</h2>
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="Cancelar"
                  onClick={() => setOpenConfirm(false)}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
              <p className={styles.shareText}>
                Al abrir, se generará el código de asistencia y el QR. Los
                estudiantes podrán registrarse y verás el contador en tiempo
                real.
              </p>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setOpenConfirm(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={doOpen}
                >
                  <ScanLine aria-hidden="true" />
                  Abrir asistencia
                </button>
              </div>
            </div>
          </div>
        )}

        {qrOpen && (
          <div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-title"
            onClick={() => setQrOpen(false)}
          >
            <div
              className={styles.modal}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.modalHead}>
                <div>
                  <h2 id="qr-title">QR de asistencia</h2>
                  <p className={styles.modalSub}>
                    {detail.subject} · Grupo {detail.group}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="Cerrar"
                  onClick={() => setQrOpen(false)}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
              {!isOpen && (
                <p className={styles.closedQrNote} role="note">
                  <Lock aria-hidden="true" />
                  Asistencia cerrada. Este código ya no acepta nuevos
                  registros.
                </p>
              )}
              <div className={styles.qrWrap}>
                <QrPlaceholder seed={detail.id.length} />
              </div>
              <p className={styles.code}>{SHARE_CODE}</p>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={copyCode}
                >
                  <Copy aria-hidden="true" />
                  {copied ? "Copiado" : "Copiar código"}
                </button>
              </div>
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => setQrOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {codeOpen && (
          <div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="code-title"
            onClick={() => setCodeOpen(false)}
          >
            <div
              className={styles.modal}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.modalHead}>
                <div>
                  <h2 id="code-title">Código de asistencia</h2>
                  <p className={styles.modalSub}>
                    {detail.subject} · Grupo {detail.group}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="Cerrar"
                  onClick={() => setCodeOpen(false)}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
              {!isOpen && (
                <p className={styles.closedQrNote} role="note">
                  <Lock aria-hidden="true" />
                  Asistencia cerrada. Este código ya no acepta nuevos
                  registros.
                </p>
              )}
              <p className={styles.codeBig}>{SHARE_CODE}</p>
              <p className={styles.shareText}>
                Comparte este código con los estudiantes para que puedan
                registrar su asistencia.
              </p>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={copyCode}
                >
                  <Copy aria-hidden="true" />
                  {copied ? "Copiado" : "Copiar código"}
                </button>
              </div>
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => setCodeOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {closeOpen && (
          <div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="close-title"
            onClick={() => setCloseOpen(false)}
          >
            <div
              className={styles.modal}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.modalHead}>
                <h2 id="close-title">¿Cerrar asistencia?</h2>
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="Cancelar"
                  onClick={() => setCloseOpen(false)}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
              <p className={styles.shareText}>
                Después de cerrar, los estudiantes ya no podrán registrarse
                mediante QR o código.
              </p>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setCloseOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={doClose}
                >
                  <Lock aria-hidden="true" />
                  Cerrar asistencia
                </button>
              </div>
            </div>
          </div>
        )}

        {manualOpen && (
          <div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-title"
            onClick={() => setManualOpen(false)}
          >
            <div
              className={styles.modal}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.modalHead}>
                <h2 id="manual-title">Agregar registro manual</h2>
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="Cancelar"
                  onClick={() => setManualOpen(false)}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
              <p className={styles.shareText}>
                Los registros posteriores al cierre requieren autorización y
                justificación.
              </p>
              <div className={styles.manualForm}>
                <div className={styles.manualField}>
                  <label htmlFor="manual-student">Estudiante</label>
                  <select
                    id="manual-student"
                    value={manualForm.studentKey}
                    onChange={(e) =>
                      setManualForm((p) => ({
                        ...p,
                        studentKey: e.target.value,
                      }))
                    }
                  >
                    <option value="">Seleccionar estudiante</option>
                    {detail.students
                      .filter((s) => s.status !== "Presente" || s.manual)
                      .map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.name} · {s.status}
                        </option>
                      ))}
                  </select>
                </div>
                <div className={styles.manualField}>
                  <label htmlFor="manual-status">Estado</label>
                  <select
                    id="manual-status"
                    value={manualForm.status}
                    onChange={(e) =>
                      setManualForm((p) => ({ ...p, status: e.target.value }))
                    }
                  >
                    <option value="Presente">Presente</option>
                    <option value="Ausente">Ausente</option>
                  </select>
                </div>
                <div className={styles.manualField}>
                  <label htmlFor="manual-justification">Justificación</label>
                  <textarea
                    id="manual-justification"
                    rows={3}
                    value={manualForm.justification}
                    onChange={(e) =>
                      setManualForm((p) => ({
                        ...p,
                        justification: e.target.value,
                      }))
                    }
                    placeholder="Explica el motivo del registro posterior al cierre"
                  />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setManualOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={!manualForm.studentKey}
                  onClick={doManual}
                >
                  <UserPlus aria-hidden="true" />
                  Agregar registro
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
