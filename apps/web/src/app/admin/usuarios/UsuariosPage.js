/* Gestión de usuarios: personas, cuentas y roles. Registrar una persona
   crea su cuenta; también se puede crear una cuenta para una persona ya
   existente, editarla, cambiarle el rol o desactivarla. */

"use client";

import { useMemo, useState } from "react";
import { Eye, Pencil, Plus, Power, ShieldCheck, Trash2, UserCog } from "lucide-react";
import {
  ConfirmDialog,
  DataTable,
  Drawer,
  EmptyState,
  FormModal,
  Notice,
  Pill,
  SearchBar,
  ui,
} from "@/components/ui";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import { tonoEstado } from "@/features/shared/selectors";
import { COLLECTIONS } from "@/services";
import { opciones } from "@/features/admin/modules/catalog";

export default function UsuariosPage() {
  const { db, add, edit, toggle, remove, createPersonaConUsuario } = useAcademy();
  const [query, setQuery] = useState("");
  const [rol, setRol] = useState("");
  const [creandoPersona, setCreandoPersona] = useState(false);
  const [creandoCuenta, setCreandoCuenta] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const personas = useMemo(() => new Map(db.personas.map((p) => [p.id, p])), [db.personas]);
  const roles = useMemo(() => new Map(db.roles.map((r) => [r.id, r])), [db.roles]);

  const filas = useMemo(() => {
    const texto = query.trim().toLowerCase();
    return db.usuarios
      .map((u) => ({ ...u, persona: personas.get(u.personaId) }))
      .filter((u) => {
        if (rol && u.rolId !== rol) return false;
        if (!texto) return true;
        return [u.persona?.nombre, u.usuario, u.persona?.identificacion]
          .join(" ")
          .toLowerCase()
          .includes(texto);
      });
  }, [db.usuarios, personas, query, rol]);

  return (
    <>
      <PageHead
        eyebrow="Administración"
        title="Usuarios"
        sub="Cuentas de acceso, personas y roles del sistema."
        actions={
          <>
            <button type="button" className={ui.btnSecondary} onClick={() => setCreandoCuenta(true)}>
              <UserCog aria-hidden="true" />
              Nueva cuenta
            </button>
            <button type="button" className={ui.btnPrimary} onClick={() => setCreandoPersona(true)}>
              <Plus aria-hidden="true" />
              Registrar persona
            </button>
          </>
        }
      />

      <Notice tone="info" icon={ShieldCheck}>
        Los roles disponibles son los del sistema: Administrador, Docente, Representante y Estudiante.
        No se pueden crear roles adicionales.
      </Notice>

      <div className={ui.toolbar}>
        <div className={ui.filterBar}>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Buscar por nombre, correo o identificación"
            ariaLabel="Buscar usuario"
          />
          <select
            className={ui.select}
            style={{ width: "auto", minHeight: 36, height: 36 }}
            value={rol}
            onChange={(event) => setRol(event.target.value)}
            aria-label="Filtrar por rol"
          >
            <option value="">Todos los roles</option>
            {db.roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>
        <span className={ui.toolbarSpacer} />
        <span className={ui.cellMuted} style={{ marginTop: 0 }}>
          {filas.length} de {db.usuarios.length}
        </span>
      </div>

      {filas.length === 0 ? (
        <EmptyState icon={UserCog} title="Sin usuarios" text="No hay coincidencias para los filtros aplicados." />
      ) : (
        <DataTable
          columns={[
            {
              key: "persona",
              header: "Persona",
              render: (row) => (
                <div>
                  <b style={{ fontSize: 13.5 }}>{row.persona?.nombre ?? "—"}</b>
                  <p className={ui.cellMuted}>
                    {row.usuario} · {row.persona?.identificacion ?? "—"}
                  </p>
                </div>
              ),
            },
            {
              key: "rolId",
              header: "Rol",
              render: (row) => <Pill tone="info">{roles.get(row.rolId)?.nombre ?? "—"}</Pill>,
            },
            { key: "ultimoAcceso", header: "Último acceso", muted: true, nowrap: true },
            {
              key: "estado",
              header: "Estado",
              render: (row) => <Pill tone={tonoEstado(row.estado)}>{row.estado}</Pill>,
            },
            {
              key: "__acciones",
              header: "Acciones",
              align: "right",
              render: (row) => (
                <div>
                  <button type="button" className={ui.linkBtn} onClick={() => setDetalle(row)}>
                    <Eye aria-hidden="true" />
                    Ver
                  </button>
                  <button
                    type="button"
                    className={ui.btnIcon}
                    aria-label={`Editar ${row.persona?.nombre ?? row.usuario}`}
                    title="Editar"
                    onClick={() => setEditando(row)}
                  >
                    <Pencil aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={ui.btnIcon}
                    aria-label={`${row.estado === "Activo" ? "Desactivar" : "Activar"} ${
                      row.persona?.nombre ?? row.usuario
                    }`}
                    title={row.estado === "Activo" ? "Desactivar" : "Activar"}
                    onClick={() =>
                      toggle(COLLECTIONS.USUARIOS)(row.id, {
                        modulo: "Usuarios",
                        accion: row.estado === "Activo" ? "Desactivó" : "Activó",
                        entidad: row.persona?.nombre ?? row.usuario,
                        descripcion: "Cuenta de acceso actualizada.",
                      })
                    }
                  >
                    <Power aria-hidden="true" />
                  </button>
                </div>
              ),
            },
          ]}
          rows={filas}
        />
      )}

      <PersonaModal
        open={creandoPersona}
        onClose={() => setCreandoPersona(false)}
        onSave={(values) => {
          createPersonaConUsuario(
            {
              persona: {
                nombre: values.nombre,
                identificacion: values.identificacion,
                correo: values.correo,
                telefono: values.telefono,
              },
              rolId: values.rolId,
              estado: values.estado,
            },
            "admin",
          );
          setCreandoPersona(false);
        }}
      />

      <CuentaModal
        open={creandoCuenta}
        onClose={() => setCreandoCuenta(false)}
        onSave={(values) => {
          const persona = personas.get(values.personaId);
          add(COLLECTIONS.USUARIOS)(
            {
              personaId: values.personaId,
              usuario: persona?.correo ?? "",
              rolId: values.rolId,
              ultimoAcceso: "—",
              estado: values.estado,
            },
            {
              modulo: "Usuarios",
              accion: "Creó",
              entidad: persona?.nombre ?? "",
              descripcion: "Cuenta de acceso creada.",
            },
          );
          setCreandoCuenta(false);
        }}
      />

      <FormModal
        open={Boolean(editando)}
        onClose={() => setEditando(null)}
        title="Editar cuenta"
        sub={editando?.persona?.nombre}
        schema={{
          sections: [
            {
              title: "Cuenta",
              fields: [
                {
                  name: "rolId",
                  label: "Rol",
                  type: "select",
                  required: true,
                  options: opciones(db.roles),
                },
                {
                  name: "estado",
                  label: "Estado",
                  type: "select",
                  required: true,
                  default: "Activo",
                  options: ["Activo", "Inactivo"],
                },
              ],
            },
            {
              title: "Persona",
              fields: [
                { name: "correo", label: "Correo", type: "email", required: true },
                { name: "telefono", label: "Teléfono" },
              ],
            },
          ],
        }}
        seed={
          editando
            ? {
                rolId: editando.rolId,
                estado: editando.estado,
                correo: editando.persona?.correo ?? "",
                telefono: editando.persona?.telefono ?? "",
              }
            : undefined
        }
        submitLabel="Guardar cambios"
        onSubmit={(values) => {
          edit(COLLECTIONS.USUARIOS)(
            editando.id,
            { rolId: values.rolId, estado: values.estado },
            {
              modulo: "Usuarios",
              accion: "Actualizó",
              entidad: editando.persona?.nombre ?? editando.usuario,
              descripcion: "Cuenta de acceso modificada.",
            },
          );
          edit(COLLECTIONS.PERSONAS)(
            editando.personaId,
            { correo: values.correo, telefono: values.telefono },
            {
              modulo: "Usuarios",
              accion: "Actualizó",
              entidad: editando.persona?.nombre ?? editando.usuario,
              descripcion: "Datos de persona actualizados.",
            },
          );
          setEditando(null);
        }}
      />

      <DetalleDrawer
        usuario={detalle}
        onClose={() => setDetalle(null)}
        onDelete={(u) => setConfirmDelete(u)}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          remove(COLLECTIONS.USUARIOS)(confirmDelete.id, {
            modulo: "Usuarios",
            accion: "Eliminó",
            entidad: confirmDelete.persona?.nombre ?? confirmDelete.usuario,
            descripcion: "Cuenta de acceso eliminada.",
          });
          setConfirmDelete(null);
        }}
        title="Eliminar cuenta"
        text={`Se eliminará la cuenta de "${confirmDelete?.persona?.nombre}". La persona seguirá existiendo en el sistema.`}
        confirmLabel="Eliminar"
        danger
        icon={Trash2}
      />
    </>
  );
}

/* Registrar una persona y su cuenta en una sola operación. */
function PersonaModal({ open, onClose, onSave }) {
  const { db } = useAcademy();
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Registrar persona"
      sub="Se crea la persona y su cuenta de acceso."
      schema={{
        sections: [
          {
            title: "Persona",
            fields: [
              { name: "nombre", label: "Nombre completo", required: true, span: "wide" },
              { name: "identificacion", label: "Identificación", required: true },
              { name: "correo", label: "Correo", type: "email", required: true },
              { name: "telefono", label: "Teléfono" },
            ],
          },
          {
            title: "Cuenta",
            fields: [
              {
                name: "rolId",
                label: "Rol",
                type: "select",
                required: true,
                default: "rol-004",
                options: opciones(db.roles),
              },
              {
                name: "estado",
                label: "Estado",
                type: "select",
                required: true,
                default: "Activo",
                options: ["Activo", "Inactivo"],
              },
            ],
          },
        ],
      }}
      submitLabel="Registrar persona"
      onSubmit={onSave}
    />
  );
}

/* Crear una cuenta para una persona que ya existe. */
function CuentaModal({ open, onClose, onSave }) {
  const { db } = useAcademy();
  const sinCuenta = db.personas.filter(
    (p) => !db.usuarios.some((u) => u.personaId === p.id),
  );
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Nueva cuenta"
      sub="Para una persona ya registrada."
      schema={{
        sections: [
          {
            title: "Cuenta",
            fields: [
              {
                name: "personaId",
                label: "Persona",
                type: "select",
                required: true,
                options: sinCuenta.map((p) => ({
                  value: p.id,
                  label: `${p.nombre} · ${p.identificacion}`,
                })),
              },
              {
                name: "rolId",
                label: "Rol",
                type: "select",
                required: true,
                default: "rol-004",
                options: opciones(db.roles),
              },
              {
                name: "estado",
                label: "Estado",
                type: "select",
                required: true,
                default: "Activo",
                options: ["Activo", "Inactivo"],
              },
            ],
          },
        ],
      }}
      submitLabel="Crear cuenta"
      onSubmit={onSave}
    />
  );
}

/* Detalle de la cuenta: persona, rol y entidades asociadas. */
function DetalleDrawer({ usuario, onClose, onDelete }) {
  const { db } = useAcademy();
  if (!usuario) return null;

  const rol = db.roles.find((r) => r.id === usuario.rolId);
  const docente = db.docentes.find((d) => d.personaId === usuario.personaId);
  const estudiante = db.estudiantes.find((e) => e.personaId === usuario.personaId);
  const representante = db.representantes.find((r) => r.personaId === usuario.personaId);

  return (
    <Drawer open onClose={onClose} title={usuario.persona?.nombre ?? "Usuario"} sub={usuario.usuario}>
      <dl className={ui.defList}>
        <div>
          <dt>Identificación</dt>
          <dd>{usuario.persona?.identificacion ?? "—"}</dd>
        </div>
        <div>
          <dt>Correo</dt>
          <dd>{usuario.persona?.correo ?? "—"}</dd>
        </div>
        <div>
          <dt>Teléfono</dt>
          <dd>{usuario.persona?.telefono ?? "—"}</dd>
        </div>
        <div>
          <dt>Rol</dt>
          <dd>{rol?.nombre ?? "—"}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>{usuario.estado}</dd>
        </div>
        <div>
          <dt>Último acceso</dt>
          <dd>{usuario.ultimoAcceso}</dd>
        </div>
      </dl>

      <h3 className={ui.eyebrow} style={{ margin: "18px 0 8px" }}>Entidades asociadas</h3>
      <ul className={ui.riskList}>
        <li>
          <div>
            <b>Docente</b>
            <span className={ui.cellMuted}>{docente?.nombre ?? "Sin registro"}</span>
          </div>
          <Pill tone={docente ? "ok" : "neutral"}>{docente ? "Sí" : "No"}</Pill>
        </li>
        <li>
          <div>
            <b>Estudiante</b>
            <span className={ui.cellMuted}>{estudiante?.nombre ?? "Sin registro"}</span>
          </div>
          <Pill tone={estudiante ? "ok" : "neutral"}>{estudiante ? "Sí" : "No"}</Pill>
        </li>
        <li>
          <div>
            <b>Representante</b>
            <span className={ui.cellMuted}>{representante?.nombre ?? "Sin registro"}</span>
          </div>
          <Pill tone={representante ? "ok" : "neutral"}>{representante ? "Sí" : "No"}</Pill>
        </li>
      </ul>

      <div className={ui.dialogActions}>
        <button type="button" className={ui.btnSecondary} onClick={onClose}>
          Cerrar
        </button>
        <button type="button" className={ui.btnDangerGhost} onClick={() => onDelete(usuario)}>
          <Trash2 aria-hidden="true" />
          Eliminar cuenta
        </button>
      </div>
    </Drawer>
  );
}
