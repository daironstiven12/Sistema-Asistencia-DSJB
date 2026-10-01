/* Vistas de detalle para facultades y programas. Se renderizan desde el
   CrudModule cuando la config declara `detalle`. */

"use client";

import { Drawer, Pill, ui } from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";

export function FacultadDetalle({ row, onClose }) {
  const { db } = useAcademy();
  if (!row) return null;

  const institucion = db.instituciones.find((i) => i.id === row.institucionId);
  const programas = db.programas.filter((p) => p.facultadId === row.id);

  return (
    <Drawer open onClose={onClose} title={row.nombre} sub={row.codigo}>
      <dl className={ui.defList}>
        <div>
          <dt>Institución</dt>
          <dd>{institucion?.nombre ?? "—"}</dd>
        </div>
        <div>
          <dt>Decano</dt>
          <dd>{row.decano || "—"}</dd>
        </div>
        <div>
          <dt>Descripción</dt>
          <dd>{row.descripcion || "—"}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>{row.estado}</dd>
        </div>
      </dl>

      <h3 className={ui.eyebrow} style={{ margin: "18px 0 8px" }}>
        Programas ({programas.length})
      </h3>
      {programas.length === 0 ? (
        <p className={ui.cellMuted}>Sin programas asociados.</p>
      ) : (
        <ul className={ui.riskList}>
          {programas.map((p) => (
            <li key={p.id}>
              <div>
                <b>{p.nombre}</b>
                <span className={ui.cellMuted}>
                  {p.codigo} · {p.modalidad} · {p.semestres} semestres
                </span>
              </div>
              <Pill tone="neutral">{p.estado}</Pill>
            </li>
          ))}
        </ul>
      )}

      <div className={ui.dialogActions}>
        <button type="button" className={ui.btnSecondary} onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Drawer>
  );
}

export function ProgramaDetalle({ row, onClose }) {
  const { db } = useAcademy();
  if (!row) return null;

  const facultad = db.facultades.find((f) => f.id === row.facultadId);
  const planes = db.planesEstudio.filter((p) => p.programaId === row.id);
  const grupos = db.grupos.filter((g) => g.programaId === row.id);
  const estudiantes = db.estudiantes.filter((e) => e.programaId === row.id);

  return (
    <Drawer open onClose={onClose} title={row.nombre} sub={row.codigo}>
      <dl className={ui.defList}>
        <div>
          <dt>Facultad</dt>
          <dd>{facultad?.nombre ?? "—"}</dd>
        </div>
        <div>
          <dt>Modalidad</dt>
          <dd>{row.modalidad}</dd>
        </div>
        <div>
          <dt>Duración</dt>
          <dd>{row.semestres} semestres</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>{row.estado}</dd>
        </div>
      </dl>

      <h3 className={ui.eyebrow} style={{ margin: "18px 0 8px" }}>
        Planes de estudio ({planes.length})
      </h3>
      {planes.length === 0 ? (
        <p className={ui.cellMuted}>Sin planes.</p>
      ) : (
        <ul className={ui.riskList}>
          {planes.map((p) => (
            <li key={p.id}>
              <div>
                <b>{p.nombre}</b>
                <span className={ui.cellMuted}>
                  Versión {p.version} · {p.creditosTotales} créditos
                </span>
              </div>
              <Pill tone="neutral">{p.estado}</Pill>
            </li>
          ))}
        </ul>
      )}

      <h3 className={ui.eyebrow} style={{ margin: "18px 0 8px" }}>
        Grupos ({grupos.length})
      </h3>
      {grupos.length === 0 ? (
        <p className={ui.cellMuted}>Sin grupos.</p>
      ) : (
        <ul className={ui.riskList}>
          {grupos.map((g) => (
            <li key={g.id}>
              <div>
                <b>{g.nombre}</b>
                <span className={ui.cellMuted}>
                  {g.aula} · {db.niveles.find((n) => n.id === g.nivelId)?.nombre ?? "—"}
                </span>
              </div>
              <Pill tone="neutral">{g.estado}</Pill>
            </li>
          ))}
        </ul>
      )}

      <h3 className={ui.eyebrow} style={{ margin: "18px 0 8px" }}>
        Estudiantes ({estudiantes.length})
      </h3>
      {estudiantes.length === 0 ? (
        <p className={ui.cellMuted}>Sin estudiantes.</p>
      ) : (
        <ul className={ui.riskList}>
          {estudiantes.slice(0, 10).map((e) => (
            <li key={e.id}>
              <div>
                <b>{e.nombre}</b>
                <span className={ui.cellMuted}>
                  {e.codigo} · {db.grupos.find((g) => g.id === e.grupoId)?.nombre ?? "—"}
                </span>
              </div>
              <Pill tone="neutral">{e.estado}</Pill>
            </li>
          ))}
        </ul>
      )}
      {estudiantes.length > 10 ? (
        <p className={ui.cellMuted} style={{ marginTop: 8 }}>
          y {estudiantes.length - 10} más…
        </p>
      ) : null}

      <div className={ui.dialogActions}>
        <button type="button" className={ui.btnSecondary} onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Drawer>
  );
}
