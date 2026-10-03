"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, FileText, Printer, XCircle } from "lucide-react";
import { ResultModal } from "@/components/SessionModal";
import { downloadActaPdf, resolverProgramaNivel } from "@/lib/actaPdf";
import { mensajeAmigable } from "@/lib/errorAmigable";
import { attendanceApi, valorActa } from "@/services/api/attendance";
import { useSessionDetail } from "../../useSessionsApi";
import styles from "./page.module.css";

/* Acta F-GCA-24 con datos reales: sesión + registros + ofertas del representante.
   Sin mock: facultad/CDS/docente/firmas quedan vacíos porque el backend actual
   (GET /attendance/sessions/:id, /records, /offerings) no los expone. */

export default function ActaContent({ id }) {
  const { sesion, registros, cargando, error, recargar } = useSessionDetail(id);
  const [ofertas, setOfertas] = useState([]);
  const [exportando, setExportando] = useState(false);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    let viva = true;
    attendanceApi
      .listOfferings()
      .then((rows) => {
        if (viva) setOfertas(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (viva) setOfertas([]);
      });
    return () => {
      viva = false;
    };
  }, []);

  const { programa, nivel } = resolverProgramaNivel(sesion ?? {}, ofertas);

  async function exportar() {
    if (exportando || !sesion) return;
    setExportando(true);
    try {
      let representanteFirma = null;
      let representanteNombre = "";
      try {
        const firmas = await attendanceApi.sessionSignatures(id);
        const lista = Array.isArray(firmas) ? firmas : [];
        const rep = lista.find((f) => f.role === "REPRESENTANTE") ?? lista[lista.length - 1];
        if (rep) {
          representanteFirma = rep.snapshot ?? null;
          representanteNombre = rep.signerName ?? "";
        }
      } catch {
        /* sin firmas accesibles: el espacio se conserva vacío */
      }
      await downloadActaPdf({
        sesion,
        registros,
        programa,
        nivel,
        facultad: valorActa(sesion?.facultad),
        cds: "",
        docente: valorActa(sesion?.docente),
        docenteFirma: null,
        representanteFirma,
        representanteNombre,
      });
      setModal({ kind: "exito", mensaje: "Acta PDF generada correctamente." });
    } catch (e) {
      setModal({
        kind: "error",
        mensaje: mensajeAmigable(e, "No se pudo generar el PDF. Inténtalo nuevamente."),
      });
    } finally {
      setExportando(false);
    }
  }

  if (cargando || !sesion) {
    return (
      <div className={styles.screen}>
        <p role="status">Cargando acta…</p>
        {error ? (
          <p role="alert">
            {error}{" "}
            <button type="button" className={styles.pdfBtn} onClick={recargar}>
              Reintentar
            </button>
          </p>
        ) : null}
        <Link href={`/asistencias/${id}`}>Volver al detalle</Link>
      </div>
    );
  }

  if (error && !sesion) {
    return (
      <div className={styles.screen}>
        <p role="alert">{error}</p>
        <button type="button" className={styles.pdfBtn} onClick={recargar}>
          Reintentar
        </button>{" "}
        <Link href="/asistencias">Volver a asistencias</Link>
      </div>
    );
  }

  const campos = [
    ["FACULTAD", ""],
    ["PROGRAMA", programa],
    ["NIVEL", nivel],
    ["ASIGNATURA", sesion.subject],
    ["CÓDIGO DE ASIGNATURA", sesion.subjectCode],
    ["PERIODO ACADÉMICO", sesion.period],
    ["CDS", ""],
    ["FECHA", sesion.date],
    ["NOMBRE Y APELLIDOS DEL DOCENTE", ""],
    ["TEMAS TRATADOS", sesion.topics || "—"],
  ];

  const filas = registros.map((r) => ({ nombre: r.nombre, identificacion: r.identificacion, firma: r.firma ?? null, tipoFirma: r.tipoFirma ?? null }));
  while (filas.length < 36) filas.push({ nombre: "", identificacion: "" });
  const pagina1 = filas.slice(0, 24);
  const pagina2 = filas.slice(24, 36);

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
            Acta F-GCA-24 con datos reales ({registros.length} registrados).
          </span>
          <button
            type="button"
            className={styles.pdfBtn}
            onClick={exportar}
            disabled={exportando}
          >
            <Download aria-hidden="true" />
            {exportando ? "Generando…" : "Descargar PDF"}
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

      {modal?.kind === "error" ? (
        <ResultModal
          open
          onClose={() => setModal(null)}
          tone="error"
          title="No fue posible completar la acción"
          message={modal.mensaje}
          actionLabel="Entendido"
          icon={XCircle}
        />
      ) : null}
      {modal?.kind === "exito" ? (
        <ResultModal
          open
          onClose={() => setModal(null)}
          tone="success"
          title="Acción completada"
          message={modal.mensaje}
          icon={CheckCircle2}
        />
      ) : null}

      <article className={styles.sheet} aria-label="Acta de asistencia F-GCA-24">
        <header className={styles.docHead}>
          <p className={styles.uni}>UNIVERSIDAD TECNOLOGICA DEL CHOCÓ</p>
          <p className={styles.uniSub}>Diego Luis Córdoba</p>
          <p className={styles.process}>PROCESO GESTIÓN CURRICULAR Y ACADÉMICA</p>
          <p className={styles.docMeta}>Código: F-GCA-24 · Versión: 1 · Fecha: 14-01-2023</p>
          <h1 className={styles.docTitle}>FORMATO DE REGISTRO DE ASISTENCIA A CLASES</h1>
        </header>

        <dl className={styles.fields}>
          {campos.map(([label, value]) => (
            <div key={label} className={styles.field}>
              <dt>{label}</dt>
              <dd>{value || "—"}</dd>
            </div>
          ))}
        </dl>

        <p style={{ fontSize: 12, margin: "14px 0 6px" }}>
          Página 1 — Estudiantes 1–24
        </p>
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
            {pagina1.map((row, index) => (
              <tr key={`p1-${index}`}>
                <td>{index + 1}</td>
                <td>{row.nombre}</td>
                <td>{row.identificacion}</td>
                <td />
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ fontSize: 12, margin: "18px 0 6px", breakBefore: "page" }}>
          Página 2 — Estudiantes 25–36
        </p>
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
            {pagina2.map((row, index) => (
              <tr key={`p2-${index}`}>
                <td>{index + 25}</td>
                <td>{row.nombre}</td>
                <td>{row.identificacion}</td>
                <td />
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.signatures}>
          <div className={styles.signBox}>
            <div className={styles.signSpace}>
              <span className={styles.signPending}>ESPACIO PARA FIRMA</span>
            </div>
            <p className={styles.signLabel}>FIRMA DEL DOCENTE</p>
          </div>
          <div className={styles.signBox}>
            <div className={styles.signSpace}>
              <span className={styles.signPending}>ESPACIO PARA FIRMA</span>
            </div>
            <p className={styles.signLabel}>FIRMA DEL REPRESENTANTE</p>
          </div>
        </div>

        <h2 style={{ fontSize: 13, textAlign: "center", marginTop: 28 }}>CONTROL DE CAMBIOS</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">FECHA</th>
              <th scope="col">CAMBIO</th>
              <th scope="col">VERSIÓN</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>14-01-2023</td>
              <td>Lanzamiento del formato</td>
              <td>01</td>
            </tr>
          </tbody>
        </table>
      </article>
    </div>
  );
}
