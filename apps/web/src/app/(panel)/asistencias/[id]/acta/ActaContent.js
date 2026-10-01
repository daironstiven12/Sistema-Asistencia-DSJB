"use client";

import Link from "next/link";
import { ArrowLeft, Download, FileText, Printer } from "lucide-react";
import { downloadActaPdf } from "@/lib/actaPdf";
import { useAttendance } from "@/prototype/AttendanceContext";
import styles from "./page.module.css";

function SignatureArea({ signature, pendingLabel }) {
  if (!signature) {
    return <span className={styles.signPending}>{pendingLabel}</span>;
  }
  if (signature.kind === "typed") {
    return <span className={styles.sigTyped}>{signature.data}</span>;
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={signature.data} alt="Firma registrada" className={styles.sigImg} />
  );
}

/* Documento oficial de asistencia con datos del prototipo. */
export default function ActaContent({ id }) {
  const { getRecord } = useAttendance();
  const record = getRecord(id);

  if (!record) {
    return (
      <div className={styles.screen}>
        <p>La asistencia no existe en esta sesión.</p>
        <Link href="/asistencias">Volver a asistencias</Link>
      </div>
    );
  }

  const complete = record.status === "Firmada";
  const fields = [
    ["FACULTAD", record.faculty],
    ["PROGRAMA", record.program],
    ["NIVEL", record.level],
    ["ASIGNATURA", record.subject],
    ["CÓDIGO DE ASIGNATURA", record.subjectCode],
    ["PERIODO ACADÉMICO", record.period],
    ["CDS", record.cds],
    ["FECHA", record.date],
    ["NOMBRE Y APELLIDOS DEL DOCENTE", record.teacher],
    ["TEMAS TRATADOS", record.topic],
  ];

  return (
    <div className={styles.screen}>
      <div className={styles.toolbar}>
        <Link href={`/asistencias/${id}`} className={styles.backLink}>
          <ArrowLeft aria-hidden="true" />
          Volver al detalle
        </Link>
        <div className={styles.toolbarRight}>
          <span className={styles.stateNote}>
            <FileText aria-hidden="true" />
            {complete
              ? "Acta lista para imprimir."
              : "Vista previa: faltan firmas para el acta definitiva."}
          </span>
          <button
            type="button"
            className={styles.pdfBtn}
            onClick={() => downloadActaPdf(record)}
          >
            <Download aria-hidden="true" />
            Descargar PDF
          </button>
          <button
            type="button"
            className={styles.printBtn}
            onClick={() => window.print()}
          >
            <Printer aria-hidden="true" />
            Imprimir acta
          </button>
        </div>
      </div>

      <article className={styles.sheet} aria-label="Acta de asistencia">
        <header className={styles.docHead}>
          <p className={styles.uni}>UNIVERSIDAD TECNOLOGICA DEL CHOCÓ</p>
          <p className={styles.uniSub}>Diego Luis Córdoba</p>
          <p className={styles.process}>PROCESO GESTIÓN CURRICULAR Y ACADÉMICA</p>
          <p className={styles.docMeta}>
            Código: F-GCA-24 · Versión: 1 · Fecha: 14-01-2023
          </p>
          <h1 className={styles.docTitle}>
            FORMATO DE REGISTRO DE ASISTENCIA A CLASES
          </h1>
        </header>

        <dl className={styles.fields}>
          {fields.map(([label, value]) => (
            <div key={label} className={styles.field}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">No.</th>
              <th scope="col">NOMBRES Y APELLIDOS DEL ESTUDIANTE</th>
              <th scope="col">NUMERO DE IDENTIFICACIÓN</th>
              <th scope="col">FIRMA</th>
            </tr>
          </thead>
          <tbody>
            {record.students.map((row, index) => (
              <tr key={row.key}>
                <td>{index + 1}</td>
                <td>{row.name}</td>
                <td>{row.idNumber}</td>
                <td>
                  {row.status === "Presente" ? (
                    row.sig && row.sig.kind !== "typed" ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={row.sig.data}
                        alt={`Firma de ${row.name}`}
                        className={styles.studentSigImg}
                      />
                    ) : (
                      <span className={styles.studentSig}>
                        {row.name}
                        {row.manual && (
                          <sup className={styles.manualMark}> 1</sup>
                        )}
                      </span>
                    )
                  ) : (
                    <span className={styles.absentMark}>
                      {row.status === "Ausente" ? "Ausente" : "—"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {record.students.some((s) => s.manual) && (
          <p className={styles.footnote}>
            1 Registro manual con justificación autorizada por el representante.
          </p>
        )}

        <div className={styles.signatures}>
          <div className={styles.signBox}>
            <div className={styles.signSpace}>
              <SignatureArea
                signature={record.teacherSignature}
                pendingLabel="PENDIENTE DE FIRMA"
              />
            </div>
            <p className={styles.signLabel}>FIRMA DEL DOCENTE</p>
            <p className={styles.signName}>{record.teacher}</p>
          </div>
          <div className={styles.signBox}>
            <div className={styles.signSpace}>
              <SignatureArea
                signature={record.repSignature}
                pendingLabel="PENDIENTE DE FIRMA"
              />
            </div>
            <p className={styles.signLabel}>FIRMA DEL REPRESENTANTE</p>
            <p className={styles.signName}>Jeanpier Polanco</p>
          </div>
        </div>
      </article>
    </div>
  );
}
