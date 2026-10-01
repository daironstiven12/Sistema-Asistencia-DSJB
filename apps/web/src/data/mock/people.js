/* Personas, cuentas y roles. Tablas: persons, users, roles, user_roles,
   students, teachers, representatives, signatures.
   Cada persona tiene un id estable: las personas base (administración y
   docentes) ocupan per-001..per-005, los estudiantes per-011..per-030 y
   los representantes per-031..per-033. Los identificadores de docente,
   estudiante y representante se derivan de la persona, nunca al revés. */

export const roles = [
  { id: "rol-001", nombre: "Administrador", descripcion: "Configuración institucional y estructura académica." },
  { id: "rol-002", nombre: "Docente", descripcion: "Administra sus clases y registra asistencia." },
  { id: "rol-003", nombre: "Representante", descripcion: "Gestiona la asistencia del grupo asignado." },
  { id: "rol-004", nombre: "Estudiante", descripcion: "Registra su asistencia y consulta reportes." },
];

const NOMBRES = [
  "Laura Daniela Mena Palacios", "Andrés Felipe Córdoba Moreno", "Juan David Mosquera Valencia",
  "Camila Andrea Rentería Díaz", "Sebastián Alejandro Mosquera Lemos",
  "Daniel Fernando Hinestroza Ríos", "Valentina Sofia Asprilla Perea",
  "Juan Pablo Murillo Cárdenas", "Mariana Alejandra Talledo",
  "Kevin José Palacio Mosquera", "Génesis Daniela Caicedo",
  "Wilmer Alfonso Toro Agudelo", "Karina Yuleth Palacios",
  "Óscar Iván Andrews Leroux", "Isabella Cristina Rendón",
  "Fabian Andrés Uzuriaga", "Yuliana Andrea Mori",
  "Brayan Stiven Quinteros", "Nadia Fernanda Charchar",
  "Erick Alfonso Cuesta", "Melissa Andrea Pantoja",
];

const base = [
  { id: "per-001", nombre: "Coordinación Académica", identificacion: "1000000001", correo: "academica@utch.edu.co", telefono: "6045931200", estado: "Activo" },
  { id: "per-002", nombre: "Dr. Carlos Andrés Meza", identificacion: "1054321098", correo: "cmeza@utch.edu.co", telefono: "3156789012", estado: "Activo" },
  { id: "per-003", nombre: "Dra. María Fernanda Rentería", identificacion: "1048765423", correo: "mfrenteria@utch.edu.co", telefono: "3177654321", estado: "Activo" },
  { id: "per-004", nombre: "Ing. Harold Uribe Uribe", identificacion: "1087654321", correo: "huribe@utch.edu.co", telefono: "3102223344", estado: "Activo" },
  { id: "per-005", nombre: "Lic. Nayra Acosta Palacios", identificacion: "1098765432", correo: "nacosta@utch.edu.co", telefono: "3185544332", estado: "Inactivo" },
];

const estudiantesPersonas = Array.from({ length: 20 }).map((_, i) => {
  const n = i + 1;
  return {
    id: `per-${String(n + 10).padStart(3, "0")}`,
    nombre: NOMBRES[i % NOMBRES.length],
    identificacion: `1077${String(40000 + n).padStart(5, "0")}`,
    correo: `estudiante${n}@utch.edu.co`,
    telefono: `31${String(2000000 + n * 137).slice(0, 7)}`,
    estado: n % 11 === 0 ? "Inactivo" : "Activo",
  };
});

const representantesPersonas = [
  { id: "per-031", nombre: "Jeanpier Polanco", identificacion: "1087654321", correo: "jpolanco@utch.edu.co", telefono: "3145567788", estado: "Activo" },
  { id: "per-032", nombre: "Marta Lucía Caicedo", identificacion: "1091122233", correo: "mcaicedo@utch.edu.co", telefono: "3123344556", estado: "Activo" },
  { id: "per-033", nombre: "Hernán Emilio Ospina", identificacion: "1075566677", correo: "hospina@utch.edu.co", telefono: "3109988776", estado: "Inactivo" },
];

export const personas = [
  ...base,
  ...estudiantesPersonas,
  ...representantesPersonas,
];

const ROL_POR_PERSONA = new Map([
  ["per-001", "rol-001"],
  ["per-002", "rol-002"],
  ["per-003", "rol-002"],
  ["per-004", "rol-002"],
  ["per-005", "rol-002"],
  ...representantesPersonas.map((p) => [p.id, "rol-003"]),
  ...estudiantesPersonas.map((p) => [p.id, "rol-004"]),
]);

export const usuarios = personas.map((persona, index) => ({
  id: `usr-${String(index + 1).padStart(3, "0")}`,
  personaId: persona.id,
  usuario: persona.correo,
  rolId: ROL_POR_PERSONA.get(persona.id) ?? "rol-004",
  ultimoAcceso: index === 0 ? "2026-09-30 08:12" : "2026-09-29 17:40",
  estado: persona.estado,
}));

const PROFESIONES = [
  "Ingeniero de Sistemas, Magíster",
  "Ingeniera de Telecomunicaciones, Magíster",
  "Ingeniero Electrónico, Especialista",
  "Licenciada en Historia, Magíster",
];

export const docentes = base
  .slice(1)
  .map((persona, i) => ({
    id: `doc-${String(i + 1).padStart(3, "0")}`,
    personaId: persona.id,
    nombre: persona.nombre,
    identificacion: persona.identificacion,
    correo: persona.correo,
    telefono: persona.telefono,
    profesion: PROFESIONES[i],
    estado: persona.estado,
  }));

/* El grupo del estudiante determina programa y nivel: se leen del grupo
   para que nunca se contradigan con groups.academic_levels. */
export const GRUPOS_DE_ESTUDIANTE = [
  { grupoId: "gru-001", programaId: "prog-002", nivelId: "niv-004" },
  { grupoId: "gru-002", programaId: "prog-002", nivelId: "niv-004" },
  { grupoId: "gru-003", programaId: "prog-001", nivelId: "niv-002" },
];

/* students: estados del ciclo de vida del estudiante. La mayoría está
   ACTIVE; hay casos INACTIVE, un GRADUATED y un WITHDRAWN para que la
   gestión de estados sea visible desde el administrador. */
const ESTADO_ESTUDIANTE = [
  "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "INACTIVE", "ACTIVE",
  "WITHDRAWN", "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "GRADUATED",
];

export const estudiantes = estudiantesPersonas.map((persona, i) => {
  const n = i + 1;
  const grupo = GRUPOS_DE_ESTUDIANTE[(n - 1) % GRUPOS_DE_ESTUDIANTE.length];
  return {
    id: `est-${String(n).padStart(3, "0")}`,
    personaId: persona.id,
    nombre: persona.nombre,
    identificacion: persona.identificacion,
    correo: persona.correo,
    telefono: persona.telefono,
    codigo: `2023${String(1000 + n)}`,
    ...grupo,
    estado: ESTADO_ESTUDIANTE[i] ?? "ACTIVE",
  };
});

const PARENTESCOS = ["Representante legal", "Madre", "Padre"];

export const representantes = representantesPersonas.map((persona, i) => ({
  id: `rep-${String(i + 1).padStart(3, "0")}`,
  personaId: persona.id,
  nombre: persona.nombre,
  identificacion: persona.identificacion,
  correo: persona.correo,
  telefono: persona.telefono,
  grupoId: GRUPOS_DE_ESTUDIANTE[i].grupoId,
  parentesco: PARENTESCOS[i],
  estado: persona.estado,
}));

/* Firmas reutilizables: signatures + sus relaciones por rol. */
export const firmas = [
  {
    id: "fir-001",
    personaId: "per-002",
    nombre: "Dr. Carlos Andrés Meza",
    tipo: "drawn",
    data: null,
    creadaEn: "2026-02-10 09:20",
    vigente: true,
  },
  {
    id: "fir-002",
    personaId: "per-003",
    nombre: "Dra. María Fernanda Rentería",
    tipo: "drawn",
    data: null,
    creadaEn: "2026-02-11 10:05",
    vigente: true,
  },
];
