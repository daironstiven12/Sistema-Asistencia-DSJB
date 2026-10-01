/* Configuración de los módulos de catálogo: facultades, programas,
   planes de estudio, asignaturas y periodos. Cada objeto alimenta
   CrudModule, así que la página solo declara qué módulo renderiza. */

import {
  BookMarked,
  Building2,
  CalendarRange,
  FolderTree,
  GraduationCap,
  School,
} from "lucide-react";
import { Pill, ui, PersonCell } from "@/components/ui";
import { COLLECTIONS } from "@/services";
import { FacultadDetalle, ProgramaDetalle } from "../detalles";

const opciones = (list, valueKey = "nombre", labelKey = "nombre") =>
  list.map((item) => ({ value: item[valueKey], label: item[labelKey] }));

/* ── Facultades ─────────────────────────────────────────────── */
export const facultadesConfig = {
  collection: COLLECTIONS.FACULTADES,
  title: "Facultades",
  singular: "facultad",
  plural: "facultades",
  icon: School,
  searchFields: ["nombre", "codigo", "decano"],
  filters: [
    { type: "search", key: "q", label: "Buscar facultad", placeholder: "Buscar por nombre, código o decano" },
    {
      key: "estado",
      label: "Estado",
      placeholder: "Todos los estados",
      options: [
        { value: "Activo", label: "Activo" },
        { value: "Inactivo", label: "Inactivo" },
      ],
    },
  ],
  columns: (db) => [
    {
      key: "nombre",
      header: "Facultad",
      render: (row) => <PersonCell name={row.nombre} detail={row.codigo} />,
    },
    {
      key: "institucionId",
      header: "Institución",
      render: (row) =>
        db.instituciones.find((i) => i.id === row.institucionId)?.nombre ?? "—",
    },
    { key: "decano", header: "Decano" },
    {
      key: "programas",
      header: "Programas",
      align: "right",
      render: (row) => db.programas.filter((p) => p.facultadId === row.id).length,
    },
    { key: "estado", header: "Estado", render: (row) => <Pill tone="neutral">{row.estado}</Pill> },
  ],
  schema: (db) => ({
    sections: [
      {
        title: "Identificación",
        fields: [
          { name: "nombre", label: "Nombre", required: true, span: "wide" },
          { name: "codigo", label: "Código", required: true, placeholder: "FI" },
          {
            name: "institucionId",
            label: "Institución",
            type: "select",
            required: true,
            options: opciones(db.instituciones),
          },
          { name: "decano", label: "Decano" },
        ],
      },
      {
        title: "Detalle",
        fields: [
          { name: "descripcion", label: "Descripción", type: "textarea", span: "wide" },
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
    codigo: values.codigo?.toUpperCase() ?? "",
  }),
  detalle: FacultadDetalle,
  deletable: true,
};

/* ── Programas ──────────────────────────────────────────────── */
export const programasConfig = {
  collection: COLLECTIONS.PROGRAMAS,
  title: "Programas",
  singular: "programa",
  plural: "programas",
  icon: GraduationCap,
  searchFields: ["nombre", "codigo"],
  filters: (db) => [
    { type: "search", key: "q", label: "Buscar programa", placeholder: "Buscar programa" },
    {
      key: "facultadId",
      label: "Facultad",
      placeholder: "Todas las facultades",
      options: opciones(db.facultades),
    },
    {
      key: "estado",
      label: "Estado",
      placeholder: "Todos los estados",
      options: [
        { value: "Activo", label: "Activo" },
        { value: "Inactivo", label: "Inactivo" },
      ],
    },
  ],
  columns: (db) => [
    {
      key: "nombre",
      header: "Programa",
      render: (row) => <PersonCell name={row.nombre} detail={row.codigo} />,
    },
    {
      key: "facultadId",
      header: "Facultad",
      render: (row) => db.facultades.find((f) => f.id === row.facultadId)?.nombre ?? "—",
    },
    { key: "modalidad", header: "Modalidad", muted: true },
    { key: "semestres", header: "Semestres", align: "right" },
    {
      key: "planes",
      header: "Planes",
      align: "right",
      render: (row) => db.planesEstudio.filter((p) => p.programaId === row.id).length,
    },
    {
      key: "grupos",
      header: "Grupos",
      align: "right",
      render: (row) => db.grupos.filter((g) => g.programaId === row.id).length,
    },
    {
      key: "estudiantes",
      header: "Estudiantes",
      align: "right",
      render: (row) => db.estudiantes.filter((e) => e.programaId === row.id).length,
    },
    { key: "estado", header: "Estado", render: (row) => <Pill tone="neutral">{row.estado}</Pill> },
  ],
  schema: (db) => ({
    sections: [
      {
        title: "Programa",
        fields: [
          { name: "nombre", label: "Nombre", required: true, span: "wide" },
          { name: "codigo", label: "Código", required: true, placeholder: "IS" },
          {
            name: "facultadId",
            label: "Facultad",
            type: "select",
            required: true,
            options: opciones(db.facultades),
          },
          {
            name: "modalidad",
            label: "Modalidad",
            type: "select",
            required: true,
            default: "Presencial",
            options: ["Presencial", "Virtual", "Distancia"],
          },
        ],
      },
      {
        title: "Estructura",
        fields: [
          {
            name: "semestres",
            label: "Duración (semestres)",
            type: "number",
            required: true,
            default: 10,
            validate: (value) => (Number(value) > 0 ? null : "Ingresa un número de semestres válido."),
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
    codigo: values.codigo?.toUpperCase() ?? "",
    semestres: Number(values.semestres),
  }),
  detalle: ProgramaDetalle,
  deletable: true,
};

/* ── Planes de estudio ──────────────────────────────────────── */
export const planesConfig = {
  collection: COLLECTIONS.PLANES,
  title: "Planes de estudio",
  singular: "plan de estudio",
  plural: "planes de estudio",
  icon: FolderTree,
  searchFields: ["nombre", "codigo"],
  filters: (db) => [
    { type: "search", key: "q", label: "Buscar plan", placeholder: "Buscar plan" },
    {
      key: "programaId",
      label: "Programa",
      placeholder: "Todos los programas",
      options: opciones(db.programas),
    },
    {
      key: "estado",
      label: "Estado",
      placeholder: "Todos los estados",
      options: [
        { value: "Activo", label: "Activo" },
        { value: "Inactivo", label: "Inactivo" },
      ],
    },
  ],
  columns: (db) => [
    {
      key: "nombre",
      header: "Plan",
      render: (row) => <PersonCell name={row.nombre} detail={row.codigo} />,
    },
    {
      key: "programaId",
      header: "Programa",
      render: (row) => db.programas.find((p) => p.id === row.programaId)?.nombre ?? "—",
    },
    { key: "version", header: "Versión", align: "right" },
    {
      key: "vigencia",
      header: "Vigencia",
      muted: true,
      render: (row) => `${row.vigenciaInicio} a ${row.vigenciaFin}`,
    },
    { key: "creditosTotales", header: "Créditos", align: "right" },
    {
      key: "asignaturas",
      header: "Asignaturas",
      align: "right",
      render: (row) =>
        db.planAsignaturas.filter((link) => link.planId === row.id).length,
    },
    { key: "estado", header: "Estado", render: (row) => <Pill tone="neutral">{row.estado}</Pill> },
  ],
  schema: (db) => ({
    sections: [
      {
        title: "Plan de estudio",
        fields: [
          { name: "nombre", label: "Nombre", required: true, span: "wide" },
          { name: "codigo", label: "Código", required: true, placeholder: "IS-2026" },
          {
            name: "programaId",
            label: "Programa",
            type: "select",
            required: true,
            options: opciones(db.programas),
          },
        ],
      },
      {
        title: "Versión y vigencia",
        fields: [
          {
            name: "version",
            label: "Versión",
            type: "number",
            required: true,
            default: 2026,
            validate: (value) =>
              Number(value) >= 2000 ? null : "Ingresa un año válido.",
          },
          { name: "vigenciaInicio", label: "Vigencia desde", type: "date", required: true },
          { name: "vigenciaFin", label: "Vigencia hasta", type: "date", required: true },
        ],
      },
      {
        title: "Créditos",
        fields: [
          {
            name: "creditosTotales",
            label: "Créditos totales",
            type: "number",
            required: true,
            default: 240,
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
    codigo: values.codigo?.toUpperCase() ?? "",
    version: Number(values.version),
    creditosTotales: Number(values.creditosTotales),
  }),
  detailHref: (row) => `/admin/planes-estudio/${row.id}`,
  deletable: true,
};

/* ── Asignaturas ────────────────────────────────────────────── */
export const asignaturasConfig = {
  collection: COLLECTIONS.ASIGNATURAS,
  title: "Asignaturas",
  singular: "asignatura",
  plural: "asignaturas",
  icon: BookMarked,
  searchFields: ["nombre", "codigo"],
  filters: [
    { type: "search", key: "q", label: "Buscar asignatura", placeholder: "Buscar por nombre o código" },
    {
      key: "tipo",
      label: "Tipo",
      placeholder: "Todos los tipos",
      options: [
        { value: "Obligatoria", label: "Obligatoria" },
        { value: "Electiva", label: "Electiva" },
      ],
    },
    {
      key: "estado",
      label: "Estado",
      placeholder: "Todos los estados",
      options: [
        { value: "Activo", label: "Activo" },
        { value: "Inactivo", label: "Inactivo" },
      ],
    },
  ],
  columns: (db) => [
    {
      key: "nombre",
      header: "Asignatura",
      render: (row) => <PersonCell name={row.nombre} detail={row.codigo} />,
    },
    { key: "creditos", header: "Créditos", align: "right" },
    {
      key: "horas",
      header: "Horas",
      align: "right",
      render: (row) => `${row.horasTeoricas + row.horasPracticas + row.horasIndependientes}/sem`,
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (row) => <Pill tone="info">{row.tipo}</Pill>,
    },
    {
      key: "planes",
      header: "Planes",
      align: "right",
      render: (row) => db.planAsignaturas.filter((l) => l.asignaturaId === row.id).length,
    },
    { key: "estado", header: "Estado", render: (row) => <Pill tone="neutral">{row.estado}</Pill> },
  ],
  schema: () => ({
    sections: [
      {
        title: "Asignatura",
        fields: [
          { name: "nombre", label: "Nombre", required: true, span: "wide" },
          { name: "codigo", label: "Código", required: true, placeholder: "MAT-101" },
          {
            name: "tipo",
            label: "Tipo",
            type: "select",
            required: true,
            default: "NORMAL",
            options: ["NORMAL", "ELECTIVE", "PRACTICE", "OTHER"],
          },
          { name: "descripcion", label: "Descripción", type: "textarea", span: "wide" },
        ],
      },
      {
        title: "Carga",
        fields: [
          {
            name: "creditos",
            label: "Créditos",
            type: "number",
            required: true,
            default: 3,
            validate: (value) => (Number(value) > 0 ? null : "Los créditos deben ser mayores que cero."),
          },
          { name: "horasTeoricas", label: "Horas teóricas", type: "number", required: true, default: 2 },
          { name: "horasPracticas", label: "Horas prácticas", type: "number", required: true, default: 1 },
          { name: "horasIndependientes", label: "Horas independientes", type: "number", required: true, default: 2 },
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
    codigo: values.codigo?.toUpperCase() ?? "",
    creditos: Number(values.creditos),
    horasTeoricas: Number(values.horasTeoricas),
    horasPracticas: Number(values.horasPracticas),
    horasIndependientes: Number(values.horasIndependientes),
  }),
  detailHref: (row) => `/admin/asignaturas/${row.id}`,
  deletable: true,
};

/* ── Periodos ───────────────────────────────────────────────── */
export const periodosConfig = {
  collection: COLLECTIONS.PERIODOS,
  title: "Periodos académicos",
  singular: "periodo",
  plural: "periodos",
  icon: CalendarRange,
  searchFields: ["nombre"],
  filters: [
    { type: "search", key: "q", label: "Buscar periodo", placeholder: "Buscar periodo" },
    {
      key: "estado",
      label: "Estado",
      placeholder: "Todos los estados",
      options: [
        { value: "PLANNED", label: "Planificado" },
        { value: "ACTIVE", label: "Activo" },
        { value: "CLOSED", label: "Cerrado" },
      ],
    },
  ],
  columns: (db) => [
    { key: "nombre", header: "Periodo", render: (row) => <b style={{ fontVariantNumeric: "tabular-nums" }}>{row.nombre}</b> },
    { key: "anio", header: "Año", muted: true },
    { key: "periodo", header: "Periodo", align: "right", muted: true },
    { key: "fechaInicio", header: "Inicio", nowrap: true },
    { key: "fechaFin", header: "Fin", nowrap: true },
    {
      key: "grupos",
      header: "Grupos",
      align: "right",
      render: (row) => db.grupos.filter((g) => g.periodoId === row.id).length,
    },
    {
      key: "sesiones",
      header: "Sesiones",
      align: "right",
      render: (row) => db.sessions.filter((s) => s.periodoId === row.id).length,
    },
    { key: "estado", header: "Estado", render: (row) => <Pill tone="neutral">{row.estado}</Pill> },
  ],
  schema: () => ({
    sections: [
      {
        title: "Periodo académico",
        fields: [
          {
            name: "nombre",
            label: "Nombre",
            required: true,
            placeholder: "2026-2",
            validate: (value) =>
              /^\d{4}-[12]$/.test(value) ? null : "Usa el formato 2026-2.",
          },
          { name: "anio", label: "Año", type: "number", required: true, default: 2026 },
          { name: "periodo", label: "Periodo", type: "number", required: true, default: 1 },
          { name: "fechaInicio", label: "Fecha de inicio", type: "date", required: true },
          {
            name: "fechaFin",
            label: "Fecha de fin",
            type: "date",
            required: true,
            validate: (value, values) =>
              values.fechaInicio && value < values.fechaInicio
                ? "La fecha de fin no puede ser anterior al inicio."
                : null,
          },
          {
            name: "estado",
            label: "Estado",
            type: "select",
            required: true,
            default: "PLANNED",
            options: ["PLANNED", "ACTIVE", "CLOSED"],
          },
        ],
      },
    ],
  }),
  normalize: (values) => ({
    ...values,
    anio: Number(values.anio),
    periodo: Number(values.periodo),
  }),
};

/* ── Institución ───────────────────────────────────────────── */
export const institucionesConfig = {
  collection: COLLECTIONS.INSTITUCIONES,
  title: "Institución",
  singular: "institución",
  plural: "instituciones",
  icon: Building2,
  searchFields: ["nombre", "codigo", "rector"],
  filters: [
    { type: "search", key: "q", label: "Buscar institución", placeholder: "Buscar por nombre, código o rector" },
    {
      key: "estado",
      label: "Estado",
      placeholder: "Todos los estados",
      options: [
        { value: "Activo", label: "Activo" },
        { value: "Inactivo", label: "Inactivo" },
      ],
    },
  ],
  columns: (db) => [
    {
      key: "nombre",
      header: "Institución",
      render: (row) => <PersonCell name={row.nombre} detail={row.codigo} />,
    },
    { key: "rector", header: "Rector" },
    { key: "nit", header: "NIT", muted: true },
    { key: "correo", header: "Correo", muted: true },
    { key: "estado", header: "Estado", render: (row) => <Pill tone="neutral">{row.estado}</Pill> },
  ],
  schema: () => ({
    sections: [
      {
        title: "Identidad institucional",
        fields: [
          { name: "nombre", label: "Nombre", required: true, span: "wide" },
          { name: "codigo", label: "Código", required: true, placeholder: "UTCH" },
          { name: "sigla", label: "Sigla", placeholder: "UTCH" },
          { name: "nit", label: "NIT", required: true, placeholder: "890.205.148-1" },
          { name: "rector", label: "Rector", required: true },
        ],
      },
      {
        title: "Contacto",
        fields: [
          { name: "ubicacion", label: "Ubicación", span: "wide" },
          { name: "telefono", label: "Teléfono" },
          { name: "correo", label: "Correo institucional", type: "email" },
          { name: "sitioWeb", label: "Sitio web", placeholder: "utch.edu.co" },
        ],
      },
      {
        title: "Estado",
        fields: [
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
    codigo: values.codigo?.toUpperCase() ?? "",
    sigla: values.sigla?.toUpperCase() ?? "",
  }),
  deletable: true,
};

/* Periodo vigente: el primero activo o, en su defecto, el más reciente. */
export function periodoActivo(db) {
  return (
    db.periodos.find((p) => p.estado === "ACTIVE") ??
    [...db.periodos].sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio))[0]
  );
}

export { opciones, ui };
