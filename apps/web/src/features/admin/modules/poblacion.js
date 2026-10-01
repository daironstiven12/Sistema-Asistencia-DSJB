/* Configuración de población: usuarios, grupos e institución.
   Usuarios y grupos no son CRUD plano: cada persona vive en `personas` y
   su rol en `usuarios`, y un grupo tiene matrícula derivada. */

import { ShieldCheck, Users } from "lucide-react";
import { Pill, PersonCell, ui } from "@/components/ui";
import { COLLECTIONS } from "@/services";
import { opciones } from "./catalog";

const ESTADOS = [
  { value: "Activo", label: "Activo" },
  { value: "Inactivo", label: "Inactivo" },
];

/* ── Usuarios ───────────────────────────────────────────────── */
export const usuariosConfig = {
  collection: COLLECTIONS.USUARIOS,
  title: "Usuarios",
  singular: "usuario",
  plural: "usuarios",
  icon: ShieldCheck,
  searchFields: ["usuario", "nombre", "identificacion"],
  filters: (db) => [
    { type: "search", key: "q", label: "Buscar usuario", placeholder: "Buscar por nombre, correo o identificación" },
    {
      key: "rolId",
      label: "Rol",
      placeholder: "Todos los roles",
      options: opciones(db.roles),
    },
    { key: "estado", label: "Estado", placeholder: "Todos los estados", options: ESTADOS },
  ],
  columns: (db) => [
    {
      key: "personaId",
      header: "Persona",
      render: (row) => {
        const persona = db.personas.find((p) => p.id === row.personaId);
        return (
          <PersonCell
            name={persona?.nombre ?? row.personaId}
            detail={`${row.usuario} · ${persona?.identificacion ?? "—"}`}
          />
        );
      },
    },
    {
      key: "rolId",
      header: "Rol",
      render: (row) => <Pill tone="info">{db.roles.find((r) => r.id === row.rolId)?.nombre ?? "—"}</Pill>,
    },
    { key: "ultimoAcceso", header: "Último acceso", muted: true, nowrap: true },
    { key: "estado", header: "Estado", render: (row) => <Pill tone="neutral">{row.estado}</Pill> },
  ],
  schema: (db) => ({
    sections: [
      {
        title: "Cuenta",
        fields: [
          {
            name: "personaId",
            label: "Persona",
            type: "select",
            required: true,
            span: "wide",
            options: db.personas.map((p) => ({ value: p.id, label: `${p.nombre} · ${p.identificacion}` })),
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
  }),
  seed: (row) => ({ personaId: row.personaId, rolId: row.rolId, estado: row.estado }),
  normalize: (values, db, existing) => {
    const persona = db.personas.find((p) => p.id === values.personaId);
    /* El correo de la cuenta es el correo de la persona: una sola fuente. */
    return {
      ...values,
      usuario: persona?.correo ?? existing?.usuario ?? "",
      ultimoAcceso: existing?.ultimoAcceso ?? "—",
    };
  },
  deletable: true,
};

/* ── Grupos ─────────────────────────────────────────────────── */
export const gruposConfig = {
  collection: COLLECTIONS.GRUPOS,
  title: "Grupos",
  singular: "grupo",
  plural: "grupos",
  icon: Users,
  searchFields: ["nombre", "aula"],
  filters: (db) => [
    { type: "search", key: "q", label: "Buscar grupo", placeholder: "Buscar grupo o aula" },
    {
      key: "programaId",
      label: "Programa",
      placeholder: "Todos los programas",
      options: opciones(db.programas),
    },
    {
      key: "periodoId",
      label: "Periodo",
      placeholder: "Todos los periodos",
      options: db.periodos.map((p) => ({ value: p.id, label: p.nombre })),
    },
    { key: "estado", label: "Estado", placeholder: "Todos los estados", options: ESTADOS },
  ],
  columns: (db) => [
    {
      key: "nombre",
      header: "Grupo",
      render: (row) => (
        <PersonCell
          name={row.nombre}
          detail={`${db.programas.find((p) => p.id === row.programaId)?.nombre ?? "—"} · ${db.niveles.find((n) => n.id === row.nivelId)?.nombre ?? "—"}`}
        />
      ),
    },
    { key: "aula", header: "Aula" },
    {
      key: "periodoId",
      header: "Periodo",
      render: (row) => db.periodos.find((p) => p.id === row.periodoId)?.nombre ?? "—",
    },
    {
      key: "matriculados",
      header: "Matriculados",
      align: "right",
      render: (row) => {
        const total = db.estudiantes.filter((e) => e.grupoId === row.id && e.estado === "ACTIVE").length;
        const lleno = total >= row.capacidad;
        return (
          <span className={lleno ? ui.cellMuted : undefined}>
            {total} / {row.capacidad}
          </span>
        );
      },
    },
    { key: "estado", header: "Estado", render: (row) => <Pill tone="neutral">{row.estado}</Pill> },
  ],
  schema: (db) => ({
    sections: [
      {
        title: "Grupo",
        fields: [
          { name: "nombre", label: "Nombre", required: true, placeholder: "VII-A" },
          {
            name: "programaId",
            label: "Programa",
            type: "select",
            required: true,
            options: opciones(db.programas),
          },
          {
            name: "nivelId",
            label: "Nivel",
            type: "select",
            required: true,
            options: db.niveles.map((n) => ({ value: n.id, label: n.nombre })),
            hint: "El nivel debe pertenecer al plan del programa.",
          },
          {
            name: "periodoId",
            label: "Periodo",
            type: "select",
            required: true,
            options: db.periodos.map((p) => ({ value: p.id, label: p.nombre })),
          },
        ],
      },
      {
        title: "Aula y capacidad",
        fields: [
          { name: "aula", label: "Aula", required: true, placeholder: "Aula 204" },
          {
            name: "capacidad",
            label: "Capacidad",
            type: "number",
            required: true,
            default: 35,
            validate: (value) => (Number(value) > 0 ? null : "La capacidad debe ser mayor que cero."),
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
  }),
  normalize: (values) => ({
    ...values,
    nombre: values.nombre?.toUpperCase() ?? "",
    capacidad: Number(values.capacidad),
  }),
  deletable: true,
};

export { ESTADOS };
