"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Keyboard,
  QrCode,
  ScanLine,
  XCircle,
} from "lucide-react";
import { useAttendance } from "@/prototype/AttendanceContext";
import { isActiveRecord, resolveCode } from "@/lib/attendanceFlow";
import { activeAssignment } from "@/data/representante";
import { SHARE_CODE } from "@/data/asistencias";
import { useStudent } from "@/prototype/StudentContext";
import styles from "./page.module.css";

function findOpen(records) {
  return records.find(
    (r) => isActiveRecord(r, activeAssignment) && r.status === "Abierta",
  );
}

function findRecentClosed(records) {
  const closed = records.filter(
    (r) =>
      isActiveRecord(r, activeAssignment) &&
      (r.status === "Cerrada" ||
        r.status === "Validada" ||
        r.status === "Firmada"),
  );
  return closed[closed.length - 1] ?? null;
}

/* Registro del estudiante con QR simulado o código manual. */
export default function RegistrarContent() {
  const { records, register, getRecord } = useAttendance();
  const { profile, signature } = useStudent();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(() => {
    if (searchParams.get("metodo") === "qr") return "scanner";
    const preset = searchParams.get("codigo");
    if (preset) {
      const resolved = resolveCode(
        records,
        preset,
        SHARE_CODE,
        profile.key,
        activeAssignment,
      );
      if (resolved.result === "confirm" || resolved.result === "duplicate") {
        return resolved.result;
      }
      return resolved.result === "closed" ? "closed" : "invalid";
    }
    return "methods";
  });
  const [code, setCode] = useState(() => searchParams.get("codigo") ?? "");
  const [recordId, setRecordId] = useState(() => {
    const preset = searchParams.get("codigo");
    if (!preset) return null;
    const resolved = resolveCode(
      records,
      preset,
      SHARE_CODE,
      profile.key,
      activeAssignment,
    );
    return resolved.recordId;
  });
  const [method, setMethod] = useState(() =>
    searchParams.get("metodo") === "qr" ? "QR" : null,
  );
  const [scanning, setScanning] = useState(false);

  const record = recordId ? getRecord(recordId) : null;
  const myEntry = record?.students.find((s) => s.key === profile.key) ?? null;

  function resolveOpen() {
    const found = findOpen(records);
    if (!found) {
      const closed = findRecentClosed(records);
      if (closed) {
        setRecordId(closed.id);
        setStep("closed");
      } else {
        setStep("invalid");
      }
      return;
    }
    setRecordId(found.id);
    const entry = found.students.find((s) => s.key === profile.key);
    setStep(entry?.status === "Presente" ? "duplicate" : "confirm");
  }

  function simulateScan() {
    setScanning(true);
    window.setTimeout(() => {
      setScanning(false);
      setMethod("QR");
      resolveOpen();
    }, 1200);
  }

  function submitCode(event) {
    event.preventDefault();
    const resolved = resolveCode(
      records,
      code,
      SHARE_CODE,
      profile.key,
      activeAssignment,
    );
    setRecordId(resolved.recordId);
    setMethod("Código");
    setStep(
      resolved.result === "confirm" || resolved.result === "duplicate"
        ? resolved.result
        : resolved.result === "closed"
          ? "closed"
          : "invalid",
    );
  }

  function confirm() {
    const result = register(recordId, profile.key, {
      method,
      signature,
    });
    if (!result.ok) {
      setStep("closed");
      return;
    }
    setStep("success");
  }

  function back() {
    setStep("methods");
    setRecordId(null);
    setMethod(null);
    setCode("");
  }

  return (
    <div className={styles.content}>
      <h1 className={styles.title}>Registrar asistencia</h1>
      <p className={styles.sub}>
        Ingresa el código proporcionado por el representante o escanea el
        código QR.
      </p>

      {step === "methods" && (
        <div className={styles.methods}>
          <section className={styles.card} aria-labelledby="qr-method">
            <h2 id="qr-method" className={styles.methodTitle}>
              Método 1 · Escanear QR
            </h2>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => setStep("scanner")}
            >
              <ScanLine aria-hidden="true" />
              Escanear QR
            </button>
          </section>
          <section className={styles.card} aria-labelledby="code-method">
            <h2 id="code-method" className={styles.methodTitle}>
              Método 2 · Código
            </h2>
            <form onSubmit={submitCode} className={styles.codeForm}>
              <label htmlFor="code">Código de asistencia</label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ASIS-7A-2026"
                autoComplete="off"
              />
              <button type="submit" className={styles.btnPrimary}>
                <Keyboard aria-hidden="true" />
                Continuar
              </button>
            </form>
          </section>
        </div>
      )}

      {step === "scanner" && (
        <section className={styles.card} aria-labelledby="scan-title">
          <h2 id="scan-title" className={styles.methodTitle}>
            Escaneo QR
          </h2>
          <div className={styles.viewfinder} aria-hidden="true">
            <i className={styles.corner} />
            <i className={styles.corner} />
            <i className={styles.corner} />
            <i className={styles.corner} />
            <QrCode />
          </div>
          <p className={styles.hint}>
            Simulación sin cámara: al pulsar se cargará una asistencia mock
            abierta.
          </p>
          <div className={styles.rowActions}>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={back}
            >
              <ArrowLeft aria-hidden="true" />
              Volver
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              disabled={scanning}
              onClick={simulateScan}
            >
              <ScanLine aria-hidden="true" />
              {scanning ? "Escaneando…" : "Simular escaneo"}
            </button>
          </div>
        </section>
      )}

      {step === "confirm" && record && (
        <section className={styles.card} aria-labelledby="confirm-title">
          <h2 id="confirm-title" className={styles.methodTitle}>
            Confirmar asistencia
          </h2>
          <dl className={styles.summary}>
            <div>
              <dt>Asignatura</dt>
              <dd>{record.subject}</dd>
            </div>
            <div>
              <dt>Grupo</dt>
              <dd>{record.group}</dd>
            </div>
            <div>
              <dt>Fecha</dt>
              <dd>{record.date}</dd>
            </div>
            <div>
              <dt>Hora</dt>
              <dd>
                {record.startTime}
                {record.endTime ? ` - ${record.endTime}` : ""}
              </dd>
            </div>
          </dl>
          <p className={styles.question}>
            ¿Deseas registrar tu asistencia para esta sesión?
          </p>
          <div className={styles.rowActions}>
            <button type="button" className={styles.btnGhost} onClick={back}>
              Cancelar
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={confirm}
            >
              <CheckCircle2 aria-hidden="true" />
              Confirmar asistencia
            </button>
          </div>
        </section>
      )}

      {step === "invalid" && (
        <section className={styles.card} aria-labelledby="invalid-title">
          <XCircle className={styles.stateIconError} aria-hidden="true" />
          <h2 id="invalid-title" className={styles.stateTitle}>
            El código de asistencia no es válido.
          </h2>
          <p className={styles.hint}>
            Verifica el código con el representante e inténtalo nuevamente.
          </p>
          <button type="button" className={styles.btnPrimary} onClick={back}>
            <ArrowLeft aria-hidden="true" />
            Intentar nuevamente
          </button>
        </section>
      )}

      {step === "closed" && record && (
        <section className={styles.card} aria-labelledby="closed-title">
          <XCircle className={styles.stateIconError} aria-hidden="true" />
          <h2 id="closed-title" className={styles.stateTitle}>
            Asistencia cerrada
          </h2>
          <p className={styles.hint}>
            {record.subject}: esta sesión ya no acepta nuevos registros.
          </p>
          <button type="button" className={styles.btnPrimary} onClick={back}>
            <ArrowLeft aria-hidden="true" />
            Volver
          </button>
        </section>
      )}

      {step === "duplicate" && record && myEntry && (
        <section className={styles.card} aria-labelledby="dup-title">
          <CheckCircle2 className={styles.stateIconOk} aria-hidden="true" />
          <h2 id="dup-title" className={styles.stateTitle}>
            Ya registraste tu asistencia
          </h2>
          <dl className={styles.summary}>
            <div>
              <dt>Asignatura</dt>
              <dd>{record.subject}</dd>
            </div>
            <div>
              <dt>Fecha</dt>
              <dd>{record.date}</dd>
            </div>
            <div>
              <dt>Hora del registro</dt>
              <dd>{myEntry.time}</dd>
            </div>
          </dl>
          <Link
            href={`/estudiante/asistencias/${record.id}`}
            className={styles.btnPrimary}
          >
            Ver mi asistencia
          </Link>
        </section>
      )}

      {step === "success" && record && myEntry && (
        <section className={styles.card} aria-labelledby="ok-title">
          <CheckCircle2 className={styles.stateIconOk} aria-hidden="true" />
          <h2 id="ok-title" className={styles.stateTitle}>
            ¡Asistencia registrada!
          </h2>
          <dl className={styles.summary}>
            <div>
              <dt>Asignatura</dt>
              <dd>{record.subject}</dd>
            </div>
            <div>
              <dt>Fecha</dt>
              <dd>{record.date}</dd>
            </div>
            <div>
              <dt>Registro</dt>
              <dd>{myEntry.time}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>
                <span className={styles.present}>PRESENTE</span>
              </dd>
            </div>
            <div>
              <dt>Firma</dt>
              <dd>{signature ? "Asociada al registro" : "Sin firma configurada"}</dd>
            </div>
          </dl>
          {!signature && (
            <p className={styles.hint}>
              Tu asistencia fue registrada. Puedes configurar tu firma para
              completar el registro oficial.{" "}
              <Link href="/estudiante/firma" className={styles.inlineLink}>
                Ir a Mi firma
              </Link>
            </p>
          )}
          <Link href="/estudiante/asistencias" className={styles.btnPrimary}>
            Ver mis asistencias
          </Link>
        </section>
      )}
    </div>
  );
}
