/* Configuración del sistema: preferencias que el administrador ajusta y
   que el resto de módulos leen del estado. Sin modo oscuro ni selector
   de roles: el panel administrativo es claro y su rol se determina por
   la sesión. */

"use client";

import { useState } from "react";
import { Building2, Check, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Card, CardHead, Notice, Pill, ui } from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import { STATUSES } from "@/features/shared/flowAdapter";

const DESCRIPCION = {
  Borrador: "Sesión creada, aún no publicada al grupo.",
  Programada: "Visible para el grupo con fecha y horario confirmados.",
  Abierta: "Acepta registro de asistencia.",
  Cerrada: "Registros consolidados; admite corrección justificada.",
  Validada: "Revisada por el representante.",
  Firmada: "Con acta firmada; estado final.",
};

export default function ConfiguracionPage() {
  const { db, config, updateConfig } = useAcademy();
  const [guardado, setGuardado] = useState(false);
  const [umbrales, setUmbrales] = useState({
    umbralRiesgo: String(config.umbralRiesgo),
    toleranciaFaltas: String(config.toleranciaFaltas),
    sesionesAntesDeFirmar: String(config.sesionesAntesDeFirmar),
  });
  const [notificaciones, setNotificaciones] = useState(config.notificarRepresentantes);
  const [registroPorDefecto, setRegistroPorDefecto] = useState(config.registroPorDefecto);

  function guardar() {
    updateConfig(
      {
        umbralRiesgo: Number(umbrales.umbralRiesgo),
        toleranciaFaltas: Number(umbrales.toleranciaFaltas),
        sesionesAntesDeFirmar: Number(umbrales.sesionesAntesDeFirmar),
        notificarRepresentantes: notificaciones,
        registroPorDefecto,
      },
      "admin",
    );
    setGuardado(true);
    window.setTimeout(() => setGuardado(false), 2400);
  }

  return (
    <>
      <PageHead
        eyebrow="Administración"
        title="Configuración"
        sub="Preferencias de la plataforma y reglas de la operación de asistencia."
      />

      <div className={ui.twoCol}>
        <Card>
          <CardHead>
            <div>
              <h2 className={ui.eyebrow}>Información institucional</h2>
              <p className={ui.cellMuted}>Datos que aparecen en actas y reportes.</p>
            </div>
            <Link href="/admin/institucion" className={ui.linkBtn}>
              <Building2 aria-hidden="true" />
              Gestionar
            </Link>
          </CardHead>
          <dl className={ui.defList}>
            <div>
              <dt>Institución activa</dt>
              <dd>{db.instituciones.find((i) => i.estado === "Activo")?.nombre ?? "—"}</dd>
            </div>
            <div>
              <dt>Periodo vigente</dt>
              <dd>{db.periodos.find((p) => p.estado === "ACTIVE")?.nombre ?? "—"}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHead>
            <div>
              <h2 className={ui.eyebrow}>Operación</h2>
              <p className={ui.cellMuted}>Estados del flujo de asistencia.</p>
            </div>
            <Pill tone="info">{STATUSES.length} estados</Pill>
          </CardHead>
          <ol className={ui.stepList}>
            {STATUSES.map((estado, i) => (
              <li key={estado}>
                <span className={ui.stepIndex}>{i + 1}</span>
                <div>
                  <b>{estado}</b>
                  <p className={ui.cellMuted}>{DESCRIPCION[estado]}</p>
                </div>
                <Pill tone="neutral">
                  {db.sessions.filter((s) => s.estado === estado).length}
                </Pill>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card>
        <CardHead>
          <div>
            <h2 className={ui.eyebrow}>Preferencias de asistencia</h2>
            <p className={ui.cellMuted}>
              El umbral de riesgo se aplica al dashboard y a los reportes en tiempo real.
            </p>
          </div>
          <button type="button" className={ui.btnPrimary} onClick={guardar}>
            <Check aria-hidden="true" />
            Guardar
          </button>
        </CardHead>

        {guardado ? (
          <p className={ui.noticeOk} role="status">
            Preferencias guardadas.
          </p>
        ) : null}

        <div className={ui.optionRow}>
          <label className={ui.optionCard}>
            <b>Asistencia mínima (%)</b>
            <input
              type="number"
              className={ui.input}
              value={umbrales.umbralRiesgo}
              onChange={(event) =>
                setUmbrales((prev) => ({ ...prev, umbralRiesgo: event.target.value }))
              }
            />
            <span className={ui.cellMuted}>Por debajo de este valor el estudiante aparece en riesgo.</span>
          </label>
          <label className={ui.optionCard}>
            <b>Tolerancia de faltas</b>
            <input
              type="number"
              className={ui.input}
              value={umbrales.toleranciaFaltas}
              onChange={(event) =>
                setUmbrales((prev) => ({ ...prev, toleranciaFaltas: event.target.value }))
              }
            />
            <span className={ui.cellMuted}>Ausencias toleradas antes de requerir justificación.</span>
          </label>
          <label className={ui.optionCard}>
            <b>Sesiones antes de firmar</b>
            <input
              type="number"
              className={ui.input}
              value={umbrales.sesionesAntesDeFirmar}
              onChange={(event) =>
                setUmbrales((prev) => ({ ...prev, sesionesAntesDeFirmar: event.target.value }))
              }
            />
            <span className={ui.cellMuted}>Sesiones cerradas que preceden a la firma del acta.</span>
          </label>
        </div>
      </Card>

      <div className={ui.twoCol}>
        <Card>
          <CardHead>
            <div>
              <h2 className={ui.eyebrow}>Notificaciones</h2>
              <p className={ui.cellMuted}>Avisos automáticos del sistema.</p>
            </div>
          </CardHead>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
            <input
              type="checkbox"
              checked={notificaciones}
              onChange={(event) => setNotificaciones(event.target.checked)}
            />
            Notificar a los representantes cuando un estudiante caiga en riesgo
          </label>
        </Card>

        <Card>
          <CardHead>
            <div>
              <h2 className={ui.eyebrow}>Registro</h2>
              <p className={ui.cellMuted}>Canal por defecto para nuevos registros.</p>
            </div>
          </CardHead>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
            Método por defecto
            <select
              className={ui.select}
              style={{ width: "auto" }}
              value={registroPorDefecto}
              onChange={(event) => setRegistroPorDefecto(event.target.value)}
              aria-label="Método de registro por defecto"
            >
              {["QR", "CODE", "MANUAL"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </Card>
      </div>

      <Notice tone="info" icon={SettingsIcon}>
        Estos valores se aplican en el cliente mientras la plataforma opera con datos simulados. Al
        conectar la API pasarán a ser parámetros del servidor.
      </Notice>

      <Notice tone="info" icon={ShieldCheck}>
        La seguridad (autenticación, contraseñas y permisos por rol) se gestionará en el backend. Aquí
        se definen los roles y sus alcances; el sistema los respeta en cada operación.
      </Notice>
    </>
  );
}
