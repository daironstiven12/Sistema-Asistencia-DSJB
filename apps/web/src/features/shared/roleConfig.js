/* Configuración por rol: navegación, permisos e identidad.
   Cada panel se construye a partir de esta tabla, de modo que añadir
   un módulo es añadir una entrada, no un componente nuevo. */

import {
  Building2,
  CalendarRange,
  ClipboardList,
  FolderTree,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogOut,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
  BarChart3,
  School,
  BookMarked,
  Bell,
  PenLine,
  QrCode,
  User,
} from "lucide-react";

export const ROLES = {
  ADMIN: "admin",
  DOCENTE: "docente",
  REPRESENTANTE: "representante",
  ESTUDIANTE: "estudiante",
};

export const ROLE_META = {
  [ROLES.ADMIN]: {
    label: "Administrador",
    home: "/admin",
    persona: {
      nombre: "Coordinación Académica",
      iniciales: "CA",
      correo: "academica@utch.edu.co",
      descripcion: "Acceso total a la estructura académica.",
    },
  },
  [ROLES.DOCENTE]: {
    label: "Docente",
    home: "/docente",
    persona: {
      nombre: "Dr. Carlos Andrés Meza",
      iniciales: "CM",
      correo: "cmeza@utch.edu.co",
      descripcion: "Clases asignadas y registro de asistencia.",
    },
  },
  [ROLES.REPRESENTANTE]: {
    label: "Representante",
    home: "/inicio",
    persona: {
      nombre: "Jeanpier Polanco",
      iniciales: "JP",
      correo: "jpolanco@utch.edu.co",
      descripcion: "Asistencia del grupo VII-A.",
    },
  },
  [ROLES.ESTUDIANTE]: {
    label: "Estudiante",
    home: "/estudiante",
    persona: {
      nombre: "Laura Daniela Mena Palacios",
      iniciales: "LM",
      correo: "estudiante1@utch.edu.co",
      descripcion: "Materias y registro de asistencia.",
    },
  },
};

/* Persona que opera cada panel. Los paneles de docente y estudiante leen
   esta identidad del mock en lugar de repetir el nombre en el componente,
   para que al conectar la API la identidad venga del token. */
export const IDENTIDAD_MOCK = {
  [ROLES.DOCENTE]: "per-002",
  [ROLES.REPRESENTANTE]: "per-031",
  [ROLES.ESTUDIANTE]: "per-011",
};

/* Navegación administrativa: un solo grupo con las opciones del módulo.
   Cada entrada apunta a una ruta real y funcional. */
export const NAV_ADMIN = [
  {
    label: "ADMINISTRACIÓN",
    items: [
      { key: "inicio", label: "Inicio", icon: LayoutDashboard, href: "/admin" },
      { key: "institucion", label: "Institución", icon: Building2, href: "/admin/institucion" },
      { key: "facultades", label: "Facultades", icon: School, href: "/admin/facultades" },
      { key: "programas", label: "Programas académicos", icon: GraduationCap, href: "/admin/programas" },
      { key: "planes-estudio", label: "Planes de estudio", icon: FolderTree, href: "/admin/planes-estudio" },
      { key: "asignaturas", label: "Asignaturas", icon: BookMarked, href: "/admin/asignaturas" },
      { key: "periodos", label: "Periodos académicos", icon: CalendarRange, href: "/admin/periodos" },
      { key: "grupos", label: "Grupos", icon: Users, href: "/admin/grupos" },
      { key: "usuarios", label: "Usuarios", icon: UserCog, href: "/admin/usuarios" },
      { key: "asignaciones", label: "Asignaciones académicas", icon: ListChecks, href: "/admin/asignaciones" },
      { key: "asistencias", label: "Asistencias", icon: ClipboardList, href: "/admin/asistencias" },
      { key: "reportes", label: "Reportes", icon: BarChart3, href: "/admin/reportes" },
      { key: "ia", label: "Analítica IA", icon: Sparkles, href: "/admin/ia", badge: "IA" },
      { key: "auditoria", label: "Auditoría", icon: ScrollText, href: "/admin/auditoria" },
      { key: "configuracion", label: "Configuración", icon: Settings, href: "/admin/configuracion" },
    ],
  },
];

export const NAV_DOCENTE = [
  {
    label: "General",
    items: [{ key: "inicio", label: "Dashboard", icon: LayoutDashboard, href: "/docente" }],
  },
  {
    label: "Docencia",
    items: [
      { key: "clases", label: "Mis clases", icon: BookMarked, href: "/docente/clases" },
      { key: "asistencias", label: "Asistencias", icon: ClipboardList, href: "/docente/asistencias" },
      { key: "estudiantes", label: "Estudiantes", icon: Users, href: "/docente/estudiantes" },
      { key: "firmas", label: "Mis firmas", icon: ShieldCheck, href: "/docente/firmas" },
    ],
  },
  {
    label: "Análisis",
    items: [
      { key: "reportes", label: "Reportes", icon: BarChart3, href: "/docente/reportes" },
      { key: "ia", label: "Asistente IA", icon: Sparkles, href: "/docente/ia", badge: "IA" },
    ],
  },
];

export const NAV_ESTUDIANTE = [
  {
    label: "General",
    items: [{ key: "inicio", label: "Inicio", icon: LayoutDashboard, href: "/estudiante" }],
  },
  {
    label: "Mi asistencia",
    items: [
      { key: "materias", label: "Mis materias", icon: BookMarked, href: "/estudiante/materias" },
      { key: "registro", label: "Registrar asistencia", icon: ListChecks, href: "/estudiante/registro" },
      { key: "registrar", label: "Escanear QR", icon: QrCode, href: "/estudiante/registrar" },
      { key: "historial", label: "Mi historial", icon: ScrollText, href: "/estudiante/historial" },
      { key: "asistencias", label: "Mis asistencias", icon: ClipboardList, href: "/estudiante/asistencias" },
    ],
  },
  {
    label: "Mi cuenta",
    items: [
      { key: "firma", label: "Mi firma", icon: PenLine, href: "/estudiante/firma" },
      { key: "perfil", label: "Mi perfil", icon: User, href: "/estudiante/perfil" },
    ],
  },
];

/* Representante: reutiliza el panel ya implementado en la aplicación. */
export const NAV_REPRESENTANTE = [
  {
    label: "General",
    items: [{ key: "inicio", label: "Inicio", icon: LayoutDashboard, href: "/inicio" }],
  },
  {
    label: "Representación",
    items: [
      { key: "asistencias", label: "Asistencias", icon: ClipboardList, href: "/asistencias" },
      { key: "grupos", label: "Mi grupo", icon: Users, href: "/grupos" },
      { key: "historial", label: "Historial", icon: ScrollText, href: "/historial" },
      { key: "reportes", label: "Reportes", icon: BarChart3, href: "/reportes" },
    ],
  },
];

export const NAV_BY_ROLE = {
  [ROLES.ADMIN]: NAV_ADMIN,
  [ROLES.DOCENTE]: NAV_DOCENTE,
  [ROLES.ESTUDIANTE]: NAV_ESTUDIANTE,
  [ROLES.REPRESENTANTE]: NAV_REPRESENTANTE,
};

/* Permisos declarativos. El backend debe respetar los mismos claims. */
export const PERMISOS = {
  [ROLES.ADMIN]: ["estructura", "usuarios", "asignaciones", "asistencias", "auditoria", "reportes"],
  [ROLES.DOCENTE]: ["propias-asistencias", "propias-clases", "firma", "reportes-propias"],
  [ROLES.REPRESENTANTE]: ["grupo-asistencias", "validar", "firmar", "novedades"],
  [ROLES.ESTUDIANTE]: ["consultar", "registrar-propia"],
};


