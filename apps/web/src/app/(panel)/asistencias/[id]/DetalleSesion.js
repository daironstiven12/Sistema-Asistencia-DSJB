"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  FileText,
  Info,
  Lock,
  Pencil,
  PenLine,
  Play,
  QrCode,
  Users,
  XCircle,
} from "lucide-react";
import modalStyles from "@/components/SessionModal.module.css";
import AccionesSesion from "@/components/AccionesSesion";
import AppShell from "@/components/AppShell";
import SignaturePad from "@/components/SignaturePad";
import { ConfirmModal, ResultModal, SessionModal } from "@/components/SessionModal";
import StatusBadge from "@/components/StatusBadge";
import { downloadActaPdf, resolverProgramaNivel } from "@/lib/actaPdf";
import { defectoPorEstado, mensajeAmigable } from "@/lib/errorAmigable";
import {
  leerSnapshotSesion,
  suscribirSesion,
  usuarioDesdeSnapshot,
} from "@/lib/sesionRepresentante";
import { attendanceApi, valorActa } from "@/services/api/attendance";
import { useSessionDetail } from "../useSessionsApi";
import styles from "../page.module.css";
import d from "./DetalleSesion.module.css";

function mimeDe(data) {
  const m = /^data:([^;,]+)[;,]/.exec(String(data ?? ""));
  return m ? m[1] : undefined;
}

const EXITO_ABRIR = "La asistencia fue abierta correctamente.";
const EXITO_CERRAR = "La asistencia fue cerrada correctamente.";
const EXITO_FIRMAR = "El acta fue firmada correctamente.";
const EXITO_TEMAS = "Temas tratados actualizados correctamente.";
const EXITO_PDF = "Acta PDF generada correctamente.";

const ESTADO_INFO = {
  Borrador: { tono: "", titulo: "Borrador", desc: "La asistencia aún no está disponible para registros." },
  Programada: { tono: "", titulo: "Programada", desc: "La asistencia está programada y aún no inicia." },
  Abierta: { tono: "info", titulo: "Abierta", desc: "Los estudiantes pueden registrar su asistencia con el código o QR." },
  Cerrada: { tono: "", titulo: "Cerrada", desc: "Ya no se aceptan nuevos registros en esta asistencia." },
  Validada: { tono: "info", titulo: "Validada", desc: "Los registros fueron validados." },
  Firmada: { tono: "positive", titulo: "Firmada", desc: "Asistencia finalizada." },
};

export default function DetalleSesion({ id }) {
  const { sesion, registros, cargando, error, ocupado, recargar, realizar, guardarTemas, actualizar } =
    useSessionDetail(id);
  const [modal, setModal] = useState(null);
  const [firmaTemporal, setFirmaTemporal] = useState(null);
  const [temasBorrador, setTemasBorrador] = useState("");
  const [guardandoTemas, setGuardandoTemas] = useState(false);
  const [errorTemas, setErrorTemas] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [ofertas, setOfertas] = useState([]);
  /* Usuario estable ante hydration: el snapshot del servidor es null (mismo
     HTML en SSR y primer render del cliente); los datos reales llegan
     después de hydration de manera controlada, sin Date/random. */
  const snapshot = useSyncExternalStore(suscribirSesion, leerSnapshotSesion, () => null);
  const usuario = useMemo(() => usuarioDesdeSnapshot(snapshot), [snapshot]);

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

  /* Refresco silencioso de registros mientras la asistencia está abierta
     (mismo endpoint existente, sin parpadeos). Alimenta la campana. */
  useEffect(() => {
    if (sesion?.status !== "Abierta") return undefined;
    const t = setInterval(() => {
      actualizar();
    }, 30000);
    return () => clearInterval(t);
  }, [sesion?.status, actualizar]);

  function mostrarError(origen, defecto) {
    setModal({
      kind: "error",
      mensaje: mensajeAmigable(origen, defecto ?? defectoPorEstado(origen)),
    });
  }

  async function copiarCodigo() {
    if (!sesion?.code) return;
    try {
      await navigator.clipboard.writeText(sesion.code);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* portapapeles no disponible */
    }
  }

  /* ── Abrir ── */
  function pedirAbrir() {
    if (!sesion || ocupado) return;
    if (sesion.status === "Abierta") {
      setModal({ kind: "info", titulo: "Asistencia ya abierta", mensaje: "La asistencia ya se encuentra disponible para registros." });
      return;
    }
    if (sesion.status === "Cerrada" || sesion.status === "Firmada") {
      setModal({ kind: "info", titulo: "Asistencia ya cerrada", mensaje: "Esta asistencia ya fue cerrada anteriormente." });
      return;
    }
    setModal({ kind: "confirm-abrir" });
  }

  async function confirmarAbrir() {
    const res = await realizar(() => attendanceApi.open(id));
    if (res.ok) {
      setModal({ kind: "exito", mensaje: EXITO_ABRIR });
    } else if (!res.bloqueado) {
      mostrarError(res.error);
    }
  }

  /* ── Cerrar ── */
  function pedirCerrar() {
    if (!sesion || ocupado) return;
    if (sesion.status === "Firmada") {
      setModal({ kind: "info", titulo: "Esta asistencia ya está firmada", mensaje: "La firma del representante ya fue registrada para esta asistencia." });
      return;
    }
    if (sesion.status === "Cerrada") {
      setModal({ kind: "info", titulo: "Asistencia ya cerrada", mensaje: "Esta asistencia ya fue cerrada anteriormente." });
      return;
    }
    setModal({ kind: "confirm-cerrar" });
  }

  async function confirmarCerrar() {
    const res = await realizar(() => attendanceApi.close(id));
    if (res.ok) {
      setModal({ kind: "exito", mensaje: EXITO_CERRAR });
    } else if (!res.bloqueado) {
      mostrarError(res.error);
    }
  }

  /* ── Firmar ── */
  function pedirFirmar() {
    if (!sesion || ocupado) return;
    if (sesion.status === "Firmada") {
      setModal({ kind: "info", titulo: "Esta asistencia ya está firmada", mensaje: "La firma del representante ya fue registrada para esta asistencia." });
      return;
    }
    setFirmaTemporal(null);
    setModal({ kind: "firmar" });
  }

  function onFirmaLista(firma) {
    setFirmaTemporal(firma);
    setModal({ kind: "confirm-firmar" });
  }

  async function confirmarFirma() {
    if (!firmaTemporal) return;
    const res = await realizar(() =>
      attendanceApi.sign(id, {
        signatureType: firmaTemporal.kind,
        signatureData: typeof firmaTemporal.data === "string" ? firmaTemporal.data : undefined,
        mimeType: mimeDe(firmaTemporal.data),
      }),
    );
    if (res.ok) {
      setFirmaTemporal(null);
      setModal({ kind: "exito", mensaje: EXITO_FIRMAR });
    } else if (!res.bloqueado) {
      mostrarError(res.error);
    }
  }

  /* ── Editar temas (rápido) y Editar acta (completo).
     El backend hoy solo persiste topics (PATCH …/sessions/:id); el resto
     se muestra como lectura con aviso explícito, sin fingir guardado. ── */
  function pedirEditarTemas() {
    if (!sesion || ocupado) return;
    setTemasBorrador(sesion.topics ?? "");
    setErrorTemas(null);
    setModal({ kind: "editar-temas" });
  }

  function pedirEditarActa() {
    if (!sesion || ocupado) return;
    setTemasBorrador(sesion.topics ?? "");
    setErrorTemas(null);
    setModal({ kind: "editar-acta" });
  }

  async function confirmarEditarActa() {
    const valor = temasBorrador.trim();
    if (!valor || valor === (sesion?.topics ?? "") || guardandoTemas) return;
    setGuardandoTemas(true);
    setErrorTemas(null);
    try {
      const res = await guardarTemas(valor);
      if (res.ok) {
        setModal({ kind: "exito", mensaje: EXITO_TEMAS });
      } else if (!res.bloqueado) {
        setErrorTemas(mensajeAmigable(res.error, defectoPorEstado(res.error)));
      }
    } finally {
      setGuardandoTemas(false);
    }
  }

  /* ── Exportar PDF ── */
  async function exportarActa() {
    if (!sesion) return;
    try {
      // Firma del representante ya registrada para esta sesión (si existe):
      // espacio preservado incluso sin firma (valores null → celdas vacías).
      let representanteFirma = null;
      let representanteNombre = "";
      try {
        const firmas = await attendanceApi.sessionSignatures(id);
        const rep = (Array.isArray(firmas) ? firmas : []).find((f) => f.role === "REPRESENTANTE")
          ?? firmas[firmas.length - 1];
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
      setModal({ kind: "exito", mensaje: EXITO_PDF });
    } catch (e) {
      mostrarError(e, "No se pudo generar el PDF. Inténtalo nuevamente.");
    }
  }

  const temasEditables =
    sesion && (sesion.status === "Cerrada" || sesion.status === "Firmada");
  const temasModificados =
    temasBorrador.trim() && temasBorrador.trim() !== (sesion?.topics ?? "");
  const firmada = sesion?.status === "Firmada";
  const estadoInfo = (sesion && ESTADO_INFO[sesion.status]) || null;
  const { programa, nivel } = resolverProgramaNivel(sesion ?? {}, ofertas);

  return (
    <AppShell active="asistencias">
      <div className={styles.content}>
        <div className={d.cabecera}>
          <nav className={d.migas} aria-label="Miga de pan">
            <Link href="/asistencias">
              <ArrowLeft aria-hidden="true" />
              Volver
            </Link>
            <span className={d.sep} aria-hidden="true">/</span>
            <Link href="/asistencias">Asistencias</Link>
            <span className={d.sep} aria-hidden="true">/</span>
            <span className={d.actual}>{sesion ? sesion.subject : "Detalle"}</span>
          </nav>
          <AccionesSesion sesion={sesion} registros={registros} usuario={usuario} />
        </div>

        <div className={d.hero}>
          <span className={d.heroIcono} aria-hidden="true">
            <BookOpen />
          </span>
          <div>
            <h1>{sesion ? sesion.subject : "Asistencia"}</h1>
            <p>{sesion ? `${sesion.group} · ${sesion.date}` : "Detalle de la sesión."}</p>
          </div>
        </div>

        {error ? (
          <p className={styles.empty} role="alert">
            {error}{" "}
            <button type="button" className={styles.btnSecondary} onClick={recargar}>
              Reintentar
            </button>
          </p>
        ) : null}

        {cargando || !sesion ? (
          <p className={styles.empty} role="status">
            Cargando asistencia…
          </p>
        ) : (
          <>
            {estadoInfo ? (
              <p className={estadoInfo.tono ? `${d.estadoBanner} ${d[estadoInfo.tono]}` : d.estadoBanner} role="status">
                <i className={d.punto} aria-hidden="true" />
                <strong>{estadoInfo.titulo}</strong>
                <span>{estadoInfo.desc}</span>
              </p>
            ) : null}

            <section className={d.card} aria-label="Información de la asistencia">
              <div className={d.cardHead}>
                <h2 className={d.cardTitle}>Información de la asistencia</h2>
                <StatusBadge status={sesion.status} />
              </div>
              <dl className={d.infoGrid}>
                <div className={d.campo}>
                  <dt>
                    <BookOpen aria-hidden="true" />
                    Asignatura
                  </dt>
                  <dd>{sesion.subject}{sesion.subjectCode ? ` · ${sesion.subjectCode}` : ""}</dd>
                </div>
                <div className={d.campo}>
                  <dt>
                    <Users aria-hidden="true" />
                    Grupo
                  </dt>
                  <dd>{sesion.group}</dd>
                </div>
                <div className={d.campo}>
                  <dt>
                    <Calendar aria-hidden="true" />
                    Fecha
                  </dt>
                  <dd>{sesion.date}</dd>
                </div>
                <div className={d.campo}>
                  <dt>
                    <Clock aria-hidden="true" />
                    Horario
                  </dt>
                  <dd>{sesion.startTime}{sesion.endTime ? ` – ${sesion.endTime}` : ""}</dd>
                </div>
              </dl>
              <div className={d.temasBox}>
                <div className={d.temasHead}>
                  <span>Temas tratados</span>
                  {temasEditables ? (
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={pedirEditarTemas}
                      disabled={ocupado}
                      title="Editar temas tratados"
                    >
                      <Pencil aria-hidden="true" />
                      Editar temas
                    </button>
                  ) : null}
                </div>
                <p>{sesion.topics || "—"}</p>
              </div>
            </section>

            {sesion.code ? (
              <section className={`${d.card} ${d.codeCard}`} aria-label="Código de asistencia">
                <span className={d.codeIcono} aria-hidden="true">
                  <QrCode />
                </span>
                <div className={d.codeInfo}>
                  <h2 className={d.cardTitle}>Código de asistencia</h2>
                  <p className={d.codeValue}>{sesion.code}</p>
                  <p className={d.codeDesc}>
                    Comparte este código con tus estudiantes para que registren su asistencia.
                  </p>
                </div>
                <div className={`${d.codeActions} ${d.botonera}`}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={copiarCodigo}
                  >
                    <Copy aria-hidden="true" />
                    {copiado ? "Copiado" : "Copiar código"}
                  </button>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => setModal({ kind: "qr" })}
                  >
                    <Eye aria-hidden="true" />
                    Ver código QR
                  </button>
                </div>
              </section>
            ) : null}

            {sesion.status === "Borrador" ? (
              <div className={`${d.acciones} ${d.botonera}`}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={ocupado}
                  onClick={pedirAbrir}
                >
                  <Play aria-hidden="true" />
                  Abrir asistencia
                </button>
              </div>
            ) : null}

            {sesion.status === "Abierta" ? (
              <div className={`${d.acciones} ${d.botonera}`}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled={ocupado}
                  onClick={pedirCerrar}
                >
                  <Lock aria-hidden="true" />
                  Cerrar asistencia
                </button>
              </div>
            ) : null}

            <section className={d.card} aria-label="Registros de asistencia">
              <div className={d.registrosHead}>
                <h2 className={d.cardTitle} style={{ margin: 0 }}>
                  <Users aria-hidden="true" />
                  Registros de asistencia
                </h2>
                <span className={d.count}>{registros.length} estudiante{registros.length === 1 ? "" : "s"}</span>
              </div>
              {registros.length === 0 ? (
                <div className={d.vacio} role="status">
                  <span className={d.vacioIcono} aria-hidden="true">
                    <Users />
                  </span>
                  <strong>Sin registros todavía</strong>
                  <p>Los estudiantes aparecerán aquí cuando registren su asistencia.</p>
                </div>
              ) : (
                <div className={d.tableWrap}>
                  <table className={d.tabla}>
                    <thead>
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Estudiante</th>
                        <th scope="col">Identificación</th>
                        <th scope="col">Hora</th>
                        <th scope="col">Método</th>
                        <th scope="col">Firma</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registros.map((r, i) => (
                        <tr key={r.id}>
                          <td className={d.num}>{String(i + 1).padStart(2, "0")}</td>
                          <td><b>{r.nombre}</b>{r.manual ? <span className={d.manual}>Manual</span> : null}</td>
                          <td>{r.identificacion}</td>
                          <td>{r.hora || "—"}</td>
                          <td><span className={d.metodo}>{r.metodo}</span></td>
                          <td className={r.firmado ? d.firmado : d.pendiente}>
                            {r.firmado ? "✓ Firmado" : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {sesion.status === "Cerrada" ? (
              <div className={`${d.acciones} ${d.botonera}`}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={ocupado}
                  onClick={pedirFirmar}
                >
                  <CheckCircle2 aria-hidden="true" />
                  Firmar como representante
                </button>
              </div>
            ) : null}

            <section className={d.card} aria-label="Acta de asistencia">
              <div className={d.cardHead}>
                <h2 className={d.cardTitle}>
                  <FileText aria-hidden="true" />
                  Acta de asistencia
                </h2>
              </div>
              {firmada ? (
                <div className={d.firmadaBox} role="status">
                  <CheckCircle2 aria-hidden="true" />
                  <div>
                    <strong>Acta firmada</strong>
                    <small>Esta asistencia fue firmada por el representante.</small>
                  </div>
                </div>
              ) : (
                <p className={d.actaEstado}>
                  Estado: {sesion.status}
                </p>
              )}
              <div className={`${d.botonera}`}>
                <Link href={`/asistencias/${sesion.id}/acta`} className={styles.btnSecondary}>
                  <FileText aria-hidden="true" />
                  Ver acta F-GCA-24
                </Link>
                {temasEditables ? (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    disabled={ocupado}
                    onClick={pedirEditarActa}
                  >
                    <Pencil aria-hidden="true" />
                    Editar acta
                  </button>
                ) : null}
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={exportarActa}
                >
                  <Download aria-hidden="true" />
                  Exportar PDF
                </button>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Confirmaciones */}
      <ConfirmModal
        open={modal?.kind === "confirm-abrir"}
        onCancel={() => setModal(null)}
        onConfirm={confirmarAbrir}
        title="¿Abrir asistencia?"
        message="La asistencia quedará disponible para que los estudiantes registren su asistencia mediante el código o QR."
        confirmLabel="Abrir asistencia"
        busy={ocupado}
        icon={Play}
      />
      <ConfirmModal
        open={modal?.kind === "confirm-cerrar"}
        onCancel={() => setModal(null)}
        onConfirm={confirmarCerrar}
        title="¿Cerrar asistencia?"
        message="Después de cerrar la asistencia, los registros normales dejarán de estar disponibles para nuevos registros."
        confirmLabel="Cerrar asistencia"
        busy={ocupado}
        icon={Lock}
      />
      <ConfirmModal
        open={modal?.kind === "confirm-firmar"}
        onCancel={() => {
          setFirmaTemporal(null);
          setModal(null);
        }}
        onConfirm={confirmarFirma}
        title="¿Firmar acta?"
        message="Al firmar, confirmarás la información registrada en esta asistencia."
        confirmLabel="Firmar acta"
        busy={ocupado}
        icon={PenLine}
      />

      {/* Código QR en modal */}
      <SessionModal
        open={modal?.kind === "qr"}
        onClose={() => setModal(null)}
        title="Código QR de asistencia"
        tone="info"
        icon={QrCode}
      >
        <div className={d.qrBox}>
          {sesion?.code ? (
            <QRCode value={sesion.code} size={200} aria-label={`Código QR ${sesion.code}`} />
          ) : null}
          <p className={d.qrCode}>{sesion?.code ?? ""}</p>
          <p className={d.qrMeta}>
            {sesion?.subject ?? ""}{sesion?.group ? ` · ${sesion.group}` : ""}
          </p>
          <button
            type="button"
            className={modalStyles.btnSecondary}
            onClick={() => setModal(null)}
          >
            Cerrar
          </button>
        </div>
      </SessionModal>

      {/* Captura de firma en overlay */}
      <SessionModal
        open={modal?.kind === "firmar"}
        onClose={() => setModal(null)}
        title="Firmar acta"
        sub="Registra la firma del representante."
        tone="form"
        icon={PenLine}
      >
        <SignaturePad
          name="Representante"
          onConfirm={onFirmaLista}
        />
        <button
          type="button"
          className={modalStyles.btnSecondary}
          onClick={() => setModal(null)}
        >
          Cancelar
        </button>
      </SessionModal>

      {/* Editar temas (rápido): solo Temas tratados */}
      <SessionModal
        open={modal?.kind === "editar-temas"}
        onClose={() => {
          if (!guardandoTemas) setModal(null);
        }}
        title="Editar temas tratados"
        sub="Edición rápida de los temas de la asistencia."
        tone="form"
        icon={Pencil}
        busy={guardandoTemas}
        actions={
          <>
            <button
              type="button"
              className={modalStyles.btnSecondary}
              onClick={() => setModal(null)}
              disabled={guardandoTemas}
            >
              Cancelar
            </button>
            <button
              type="button"
              data-autofocus
              className={modalStyles.btnPrimary}
              onClick={confirmarEditarActa}
              disabled={guardandoTemas || !temasModificados}
            >
              {guardandoTemas ? "Guardando…" : "Guardar cambios"}
            </button>
          </>
        }
      >
        <div className={modalStyles.field}>
          <label htmlFor="temas-tratados">TEMAS TRATADOS</label>
          <textarea
            id="temas-tratados"
            className={modalStyles.textarea}
            rows={5}
            value={temasBorrador}
            maxLength={2000}
            onChange={(e) => setTemasBorrador(e.target.value)}
            disabled={guardandoTemas}
          />
          {errorTemas ? (
            <p className={modalStyles.inlineError} role="alert">
              {errorTemas}
            </p>
          ) : null}
        </div>
      </SessionModal>

      {/* Editar acta (completo): datos reales del acta; solo Temas se
          persiste (PATCH …/sessions/:id acepta únicamente topics). */}
      <SessionModal
        open={modal?.kind === "editar-acta"}
        onClose={() => {
          if (!guardandoTemas) setModal(null);
        }}
        title="Editar información del acta"
        sub="Revisa la información del acta. Solo Temas tratados puede guardarse hoy."
        tone="form"
        icon={Pencil}
        busy={guardandoTemas}
        actions={
          <>
            <button
              type="button"
              className={modalStyles.btnSecondary}
              onClick={() => setModal(null)}
              disabled={guardandoTemas}
            >
              Cancelar
            </button>
            <button
              type="button"
              data-autofocus
              className={modalStyles.btnPrimary}
              onClick={confirmarEditarActa}
              disabled={guardandoTemas || !temasModificados}
            >
              {guardandoTemas ? "Guardando…" : "Guardar cambios"}
            </button>
          </>
        }
      >
        <div className={d.editorAviso} role="note">
          Los campos bloqueados no tienen endpoint de actualización todavía; se muestran
          como lectura. Solo Temas tratados se guarda en el servidor.
        </div>

        <h3 className={d.editorSeccion}>Información académica</h3>
        <dl className={d.editorGrid}>
          {[
            ["Facultad", ""],
            ["Programa", programa],
            ["Nivel", nivel],
            ["Asignatura", sesion?.subject ?? ""],
            ["Código", sesion?.subjectCode ?? ""],
            ["Grupo", sesion?.group ?? ""],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta} className={d.editorCampo}>
              <dt>{etiqueta}</dt>
              <dd>{valor || "—"}</dd>
            </div>
          ))}
        </dl>

        <h3 className={d.editorSeccion}>Información de la clase</h3>
        <dl className={d.editorGrid}>
          {[
            ["Docente", ""],
            ["Fecha", sesion?.date ?? ""],
            ["Hora inicio", sesion?.startTime ?? ""],
            ["Hora fin", sesion?.endTime ?? ""],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta} className={d.editorCampo}>
              <dt>{etiqueta}</dt>
              <dd>{valor || "—"}</dd>
            </div>
          ))}
        </dl>
        <div className={modalStyles.field}>
          <label htmlFor="temas-tratados-acta">TEMAS TRATADOS (EDITABLE)</label>
          <textarea
            id="temas-tratados-acta"
            className={modalStyles.textarea}
            rows={4}
            value={temasBorrador}
            maxLength={2000}
            onChange={(e) => setTemasBorrador(e.target.value)}
            disabled={guardandoTemas}
          />
          {errorTemas ? (
            <p className={modalStyles.inlineError} role="alert">
              {errorTemas}
            </p>
          ) : null}
        </div>

        <h3 className={d.editorSeccion}>Registros de asistencia ({registros.length})</h3>
        {registros.length === 0 ? (
          <p className={modalStyles.hint}>Sin registros todavía.</p>
        ) : (
          <ul className={d.editorRegistros}>
            {registros.map((r) => (
              <li key={r.id}>
                <b>{r.nombre}</b> · {r.identificacion} · {r.hora || "—"} · {r.metodo}
                {r.manual ? " · Manual" : ""} · {r.firmado ? "Firmado" : "Sin firma"}
              </li>
            ))}
          </ul>
        )}

        <h3 className={d.editorSeccion}>Firmas</h3>
        <dl className={d.editorGrid}>
          <div className={d.editorCampo}>
            <dt>Docente</dt>
            <dd>Sin información de firma</dd>
          </div>
          <div className={d.editorCampo}>
            <dt>Representante</dt>
            <dd>{firmada ? "Registrada" : "Pendiente"}</dd>
          </div>
        </dl>
      </SessionModal>

      {/* Resultado */}
      <ResultModal
        open={modal?.kind === "exito"}
        onClose={() => setModal(null)}
        tone="success"
        title="Acción completada"
        message={modal?.mensaje ?? ""}
        icon={CheckCircle2}
      />
      <ResultModal
        open={modal?.kind === "error"}
        onClose={() => setModal(null)}
        tone="error"
        title="No fue posible completar la acción"
        message={modal?.mensaje ?? ""}
        actionLabel="Entendido"
        icon={XCircle}
      />
      <ResultModal
        open={modal?.kind === "info"}
        onClose={() => setModal(null)}
        tone="info"
        title={modal?.titulo ?? ""}
        message={modal?.mensaje ?? ""}
        actionLabel="Entendido"
        icon={Info}
      />
    </AppShell>
  );
}
