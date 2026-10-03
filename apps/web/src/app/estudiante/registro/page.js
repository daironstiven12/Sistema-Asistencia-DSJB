/* Registrar asistencia en 2 pasos: código → datos del acta.
   Paso 1: valida el código contra la vista previa (sesión ABIERTA).
   Paso 2: nombre completo + cédula + firma (SignaturePad) → POST
   /attendance/registrations. La sesión sale del código; el JWT aporta
   trazabilidad. Sin mocks. */

"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Keyboard, PenLine, UserRound, XCircle } from "lucide-react";
import SignaturePad from "@/components/SignaturePad";
import { SessionModal } from "@/components/SessionModal";
import { EmptyState, Notice, ui } from "@/components/ui";
import { PageHead } from "@/features/shared/PageHead";
import { estudianteApi } from "@/services/api/estudiante";
import { mensajeAmigable } from "@/lib/errorAmigable";

function mensajeError(error, defecto) {
  // Los mensajes de negocio del backend pasan tal cual; cualquier contenido
  // técnico se reemplaza por defecto.
  return mensajeAmigable(error, defecto);
}

function mimeDeFirma(firma) {
  const data = firma?.data ?? "";
  if (typeof data !== "string" || !data.startsWith("data:")) return null;
  const coma = data.indexOf(",");
  if (coma < 0) return null;
  const tipo = data.slice(5, coma).split(";")[0].trim().toLowerCase();
  return tipo.startsWith("image/") ? tipo : null;
}

function fechaCorta(iso) {
  if (!iso) return null;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function horaDe(respuesta) {
  const cruda = respuesta?.registered_at ?? respuesta?.registeredAt ?? null;
  if (!cruda) return null;
  const fecha = new Date(cruda);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RegistroAsistenciaPage() {
  const [paso, setPaso] = useState(1);
  const [codigo, setCodigo] = useState("");
  const [sesion, setSesion] = useState(null);
  const [validando, setValidando] = useState(false);
  const [errorCodigo, setErrorCodigo] = useState(null);
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [firma, setFirma] = useState(null);
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const campoRef = useRef(null);

  /* Pre-relleno cuando se llega desde el inicio con ?code=. Se escribe
     directo al DOM en efecto (sin re-render) para no divergir del HTML
     pre-renderizado y evitar errores de hydration. onContinuar lee el
     campo vía ref, así que el estado se sincroniza al continuar. */
  useEffect(() => {
    try {
      const entrante = new URLSearchParams(window.location.search).get("code");
      if (entrante?.trim() && campoRef.current) {
        campoRef.current.value = entrante.trim().toUpperCase();
      }
    } catch {
      /* sin URL disponible: se mantiene el campo vacío. */
    }
  }, []);

  async function onContinuar(event) {
    event.preventDefault();
    if (validando) return;
    const limpio = (campoRef.current?.value ?? codigo).trim().toUpperCase();
    if (!limpio) {
      setErrorCodigo("Ingresa el código de asistencia.");
      return;
    }
    setErrorCodigo(null);
    setValidando(true);
    try {
      const vista = await estudianteApi.vistaPreviaPorCodigo(limpio);
      setCodigo(limpio);
      setSesion(vista ?? null);
      setError(null);
      setPaso(2);
    } catch (e) {
      setErrorCodigo(mensajeError(e, "No pudimos validar el código. Inténtalo nuevamente."));
    } finally {
      setValidando(false);
    }
  }

  function volverAlCodigo() {
    setPaso(1);
    setError(null);
  }

  /* Cierre del modal de éxito: vista limpia (paso 1 con formulario vacío).
     La info del resultado se conserva en `exito` hasta este punto. */
  function cerrarExito() {
    setExito(null);
    setSesion(null);
    setPaso(1);
    setError(null);
    setErrorCodigo(null);
    if (campoRef.current) campoRef.current.value = "";
    setCodigo("");
    setNombre("");
    setCedula("");
    setFirma(null);
  }

  async function onRegistrar(event) {
    event.preventDefault();
    if (registrando) return;
    if (!firma) {
      setError("Debes registrar tu firma.");
      return;
    }
    setError(null);
    setExito(null);
    setRegistrando(true);
    try {
      const respuesta = await estudianteApi.registrarAsistencia({
        code: codigo,
        fullName: nombre,
        identificationNumber: cedula,
        signatureType: firma.kind,
        signatureData: firma.data,
        mimeType: mimeDeFirma(firma),
      });
      // Solo con 201 real se muestra el modal: apiRequest lanza en 400/409/500.
      setExito({
        codigo,
        respuesta,
        asignatura: sesion?.subject ?? null,
        fechaSesion: fechaCorta(sesion?.date),
        hora: horaDe(respuesta),
      });
    } catch (e) {
      setError(mensajeError(e, "No pudimos registrar tu asistencia. Inténtalo nuevamente."));
    } finally {
      setRegistrando(false);
    }
  }

  const hora = exito?.hora ?? null;
  const fechaSesion = fechaCorta(sesion?.date);

  return (
    <>
      <PageHead
        eyebrow="Estudiante"
        title="Registrar asistencia"
        sub={
          paso === 1
            ? "Ingresa el código proporcionado por tu representante para registrar tu asistencia."
            : "Completa tus datos para dejar tu asistencia registrada en el acta."
        }
      />

      {paso === 1 ? (
        <div className={ui.card} style={{ maxWidth: 560 }}>
          <form onSubmit={onContinuar}>
            <div className={ui.field}>
              <label htmlFor="codigo-asistencia">Código de asistencia</label>
              <input
                id="codigo-asistencia"
                ref={campoRef}
                className={ui.input}
                style={{ textTransform: "uppercase" }}
                placeholder="ASIS-XXXXXXXX"
                autoComplete="off"
                defaultValue={codigo}
                onChange={(event) => setCodigo(event.target.value)}
                disabled={validando}
                required
              />
            </div>
            <button type="submit" className={ui.btnPrimary} disabled={validando}>
              <Keyboard aria-hidden="true" />
              {validando ? "Validando…" : "Continuar"}
            </button>
          </form>
        </div>
      ) : (
        <div className={ui.card} style={{ maxWidth: 560 }}>
          {sesion ? (
            <Notice tone="ok" icon={CheckCircle2}>
              {`Sesión válida${sesion.subject ? `: ${sesion.subject}` : ""}${sesion.group ? ` · ${sesion.group}` : ""}${fechaSesion ? ` · ${fechaSesion}` : ""}`}
            </Notice>
          ) : null}
          <form onSubmit={onRegistrar}>
            <div className={ui.field}>
              <label htmlFor="nombre-completo">Nombre completo</label>
              <input
                id="nombre-completo"
                className={ui.input}
                placeholder="Nombres y apellidos"
                autoComplete="name"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                disabled={registrando}
                required
              />
            </div>
            <div className={ui.field}>
              <label htmlFor="cedula">Cédula</label>
              <input
                id="cedula"
                className={ui.input}
                placeholder="Número de identificación"
                autoComplete="off"
                inputMode="numeric"
                value={cedula}
                onChange={(event) => setCedula(event.target.value)}
                disabled={registrando}
                required
              />
            </div>
            <div className={ui.field}>
              <label htmlFor="firma-asistencia">Firma</label>
              <SignaturePad
                name={nombre || "Estudiante"}
                onConfirm={(next) => setFirma(next)}
              />
              {firma ? (
                <p className={ui.cellMuted} role="status">
                  <PenLine aria-hidden="true" /> Firma lista para registrarse.
                </p>
              ) : null}
            </div>
            <button type="submit" className={ui.btnPrimary} disabled={registrando || !firma}>
              <UserRound aria-hidden="true" />
              {registrando ? "Registrando asistencia…" : "Registrar asistencia"}
            </button>
            <p className={ui.cellMuted} style={{ marginTop: 8 }}>
              <button type="button" className={ui.linkBtn} onClick={volverAlCodigo}>
                <ArrowLeft aria-hidden="true" /> Cambiar código
              </button>
            </p>
          </form>
        </div>
      )}

      {errorCodigo && paso === 1 ? (
        <Notice tone="error" icon={XCircle}>
          {errorCodigo}
        </Notice>
      ) : null}

      {error ? (
        <Notice tone="error" icon={XCircle}>
          {error}
        </Notice>
      ) : null}

      {exito ? (
        <SessionModal
          open
          onClose={cerrarExito}
          title="Asistencia registrada"
          sub="Tu asistencia fue registrada correctamente."
          tone="success"
          icon={CheckCircle2}
          actions={
            <button type="button" data-autofocus className={ui.btnPrimary} onClick={cerrarExito}>
              Continuar
            </button>
          }
        >
          <dl className={ui.defList}>
            {exito.asignatura ? (
              <div>
                <dt>Asignatura</dt>
                <dd>{exito.asignatura}</dd>
              </div>
            ) : null}
            {exito.fechaSesion ? (
              <div>
                <dt>Fecha</dt>
                <dd>{exito.fechaSesion}</dd>
              </div>
            ) : null}
            {hora ? (
              <div>
                <dt>Hora de registro</dt>
                <dd>{hora}</dd>
              </div>
            ) : null}
          </dl>
        </SessionModal>
      ) : null}

      {!exito && !error && !errorCodigo && paso === 1 ? (
        <EmptyState
          icon={Keyboard}
          title="¿Cómo obtengo el código?"
          text="Tu representante comparte el código cuando abre la asistencia (en el tablero o por QR). Solo funcionan los códigos de sesiones abiertas de tu grupo."
        />
      ) : null}
    </>
  );
}
