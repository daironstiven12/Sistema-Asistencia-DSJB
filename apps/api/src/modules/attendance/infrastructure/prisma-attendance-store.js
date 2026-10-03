const {
  AttendanceConflictError,
  AttendanceInvalidReferenceError,
  AttendanceNotFoundError,
} = require("../application/attendance-errors");
const { generateAttendanceCode } = require("../domain/attendance-status");

function normalize(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return String(value);
  if (typeof value === "object" && value !== null && value.constructor?.name === "Decimal") {
    return Number(value);
  }
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalize(v)]));
  }
  return value;
}

function clean(data) {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

async function run(promise) {
  try {
    return await promise;
  } catch (error) {
    if (error?.code === "P2025") throw new AttendanceNotFoundError();
    throw error;
  }
}

async function creating(promise) {
  try {
    return await promise;
  } catch (error) {
    if (error?.code === "P2002") throw new AttendanceConflictError();
    if (error?.code === "P2003") throw new AttendanceInvalidReferenceError();
    throw error;
  }
}

function bigId(value) {
  try {
    return BigInt(value);
  } catch {
    throw new AttendanceInvalidReferenceError();
  }
}

function whereId(id) {
  try {
    return { id: BigInt(id) };
  } catch {
    throw new AttendanceNotFoundError();
  }
}

function required(row) {
  if (!row) throw new AttendanceNotFoundError();
  return row;
}

const SESSION_INCLUDE = {
  attendance_statuses: { select: { code: true, name: true } },
  // Docente de la sesión (teacher_user_id → users → persons): solo los
  // nombres para el acta. Sin teaching_assignments.
  users_attendance_sessions_teacher_user_idTousers: {
    select: {
      persons: {
        select: { first_name: true, middle_name: true, last_name: true, second_last_name: true },
      },
    },
  },
  course_offerings: {
    select: {
      id: true,
      group_id: true,
      academic_period_id: true,
      // Facultad del grupo (group → program → faculty): solo nombres.
      academic_groups: {
        select: {
          id: true,
          name: true,
          academic_programs: { select: { name: true, faculties: { select: { name: true } } } },
        },
      },
      academic_periods: { select: { id: true, name: true } },
      curriculum_subjects: {
        select: {
          id: true,
          subjects: { select: { id: true, code: true, name: true } },
        },
      },
    },
  },
};

class PrismaAttendanceStore {
  constructor(prisma) {
    this.prisma = prisma;
  }

  // Catálogos operativos: se resuelven por código y se aprovisionan si la
  // tabla está vacía (sin migraciones ni cambios manuales).
  async statusByCode(code) {
    const found = await this.prisma.attendance_statuses.findUnique({ where: { code } });
    if (found) return normalize(found);
    return creating(
      this.prisma.attendance_statuses.create({ data: { code, name: code } }),
    ).then(normalize);
  }

  async methodByCode(code, name) {
    const found = await this.prisma.attendance_registration_methods.findUnique({
      where: { code },
    });
    if (found) return normalize(found);
    return creating(
      this.prisma.attendance_registration_methods.create({ data: { code, name: name ?? code } }),
    ).then(normalize);
  }

  async roleByName(name) {
    return run(
      this.prisma.roles.findUnique({ where: { name } }).then(required),
    ).then(normalize);
  }

  async offeringGet(id) {
    return run(
      this.prisma.course_offerings
        .findUnique({
          where: whereId(id),
          include: {
            academic_groups: { select: { id: true, name: true } },
            academic_periods: { select: { id: true, name: true } },
          },
        })
        .then(required),
    ).then(normalize);
  }

  async assignmentFor({ userId, groupId, periodId }) {
    return this.prisma.representative_assignments
      .findFirst({
        where: {
          user_id: bigId(userId),
          group_id: bigId(groupId),
          academic_period_id: bigId(periodId),
          status: "ACTIVE",
        },
      })
      .then(normalize);
  }

  async teacherForOffering(offeringId) {
    const row = await this.prisma.teaching_assignments.findFirst({
      where: { course_offering_id: bigId(offeringId), status: "ACTIVE" },
      orderBy: { id: "asc" },
    });
    return normalize(row);
  }

  async studentOfUser(userId) {
    const user = await run(
      this.prisma.users.findUnique({ where: whereId(userId) }).then(required),
    );
    const student = await this.prisma.students.findUnique({
      where: { person_id: user.person_id },
      include: { persons: true },
    });
    return normalize(student);
  }

  async personOfUser(userId) {
    const user = await run(
      this.prisma.users.findUnique({ where: whereId(userId) }).then(required),
    );
    return run(
      this.prisma.persons.findUnique({ where: { id: user.person_id } }).then(required),
    ).then(normalize);
  }

  // Resolución por cédula para el registro por código: la misma cédula
  // normalizada siempre devuelve la misma persona (o null si no existe).
  async personByIdentificationNumber(identificationNumber) {
    return this.prisma.persons
      .findFirst({ where: { identification_number: String(identificationNumber) } })
      .then(normalize);
  }

  async personCreate({ firstName, middleName, lastName, secondLastName, identificationNumber }) {
    return creating(
      this.prisma.persons.create({
        data: clean({
          first_name: firstName,
          middle_name: middleName ?? undefined,
          last_name: lastName,
          second_last_name: secondLastName ?? undefined,
          identification_number: identificationNumber,
        }),
      }),
    ).then(normalize);
  }

  async studentOfPerson(personId) {
    return this.prisma.students
      .findUnique({ where: { person_id: bigId(personId) } })
      .then(normalize);
  }

  async studentCreate({ personId }) {
    return creating(
      this.prisma.students.create({ data: { person_id: bigId(personId) } }),
    ).then(normalize);
  }

  async membership({ studentId, groupId }) {
    // Prisma nombra el unique compuesto por sus campos (group_id_student_id),
    // no por el nombre de la restricción en PostgreSQL (uq_group_student).
    return this.prisma.group_students
      .findUnique({
        where: {
          group_id_student_id: { group_id: bigId(groupId), student_id: bigId(studentId) },
        },
      })
      .then(normalize);
  }

  // Ofertas utilizables por el representante: solo las de sus grupos
  // asignados (representative_assignments ACTIVE), con contexto para el selector.
  async offeringsForRepresentative(userId) {
    const assignments = await this.prisma.representative_assignments.findMany({
      where: { user_id: bigId(userId), status: "ACTIVE" },
      select: { group_id: true, academic_period_id: true },
    });
    if (assignments.length === 0) return [];
    const rows = await this.prisma.course_offerings.findMany({
      where: {
        status: "ACTIVE",
        OR: assignments.map((a) => ({
          group_id: a.group_id,
          academic_period_id: a.academic_period_id,
        })),
      },
      include: {
        curriculum_subjects: { select: { subjects: { select: { code: true, name: true } } } },
        academic_groups: {
          select: {
            name: true,
            academic_levels: { select: { name: true } },
            academic_programs: { select: { name: true } },
          },
        },
        academic_periods: { select: { name: true } },
      },
      orderBy: { id: "asc" },
    });
    return normalize(rows);
  }

  async sessionCreate({ courseOfferingId, teacherUserId, representativeUserId, statusId, sessionDate, startTime, endTime, topics }) {
    return creating(
      this.prisma.attendance_sessions.create({
        data: clean({
          course_offering_id: bigId(courseOfferingId),
          teacher_user_id: bigId(teacherUserId),
          representative_user_id: bigId(representativeUserId),
          attendance_status_id: bigId(statusId),
          session_date: sessionDate,
          start_time: startTime,
          end_time: endTime,
          topics,
        }),
      }),
    ).then(normalize);
  }

  async sessionGet(id) {
    return run(
      this.prisma.attendance_sessions
        .findUnique({ where: whereId(id), include: SESSION_INCLUDE })
        .then(required),
    ).then(normalize);
  }

  async sessionByCode(code) {
    return this.prisma.attendance_sessions
      .findUnique({ where: { attendance_code: String(code) }, include: SESSION_INCLUDE })
      .then(normalize);
  }

  async sessionListByRepresentative(userId) {
    return this.prisma.attendance_sessions
      .findMany({
        where: { representative_user_id: bigId(userId) },
        include: SESSION_INCLUDE,
        orderBy: [{ session_date: "desc" }, { id: "desc" }],
      })
      .then(normalize);
  }

  async sessionListAll() {
    return this.prisma.attendance_sessions
      .findMany({ include: SESSION_INCLUDE, orderBy: [{ session_date: "desc" }, { id: "desc" }] })
      .then(normalize);
  }

  // Pares (grupo, período) con asignación ACTIVE: el alcance del historial
  // del representante. Sin filas aquí, el representante no ve sesiones.
  async representativeScope(userId) {
    const rows = await this.prisma.representative_assignments.findMany({
      where: { user_id: bigId(userId), status: "ACTIVE" },
      select: { group_id: true, academic_period_id: true },
    });
    return normalize(rows);
  }

  // Historial paginado en base de datos: un findMany + un count con el
  // mismo where (sin N+1: recordsCount viene de _count en la consulta).
  async sessionHistory({ scope, status, from, to, courseOfferingId, search, skip, take }) {
    const and = [];
    if (scope) {
      and.push({
        course_offerings: {
          OR: scope.map((a) => ({
            group_id: bigId(a.group_id),
            academic_period_id: bigId(a.academic_period_id),
          })),
        },
      });
    }
    if (status) and.push({ attendance_statuses: { code: status } });
    if (from || to) and.push({ session_date: clean({ gte: from, lte: to }) });
    if (courseOfferingId !== undefined) and.push({ course_offering_id: bigId(courseOfferingId) });
    const q = String(search ?? "").trim();
    if (q) {
      and.push({
        OR: [
          { course_offerings: { curriculum_subjects: { subjects: { name: { contains: q, mode: "insensitive" } } } } },
          { course_offerings: { curriculum_subjects: { subjects: { code: { contains: q, mode: "insensitive" } } } } },
          { course_offerings: { academic_groups: { name: { contains: q, mode: "insensitive" } } } },
        ],
      });
    }
    const where = and.length > 0 ? { AND: and } : {};
    const orderBy = [{ session_date: "desc" }, { start_time: "desc" }, { id: "desc" }];
    const [total, rows] = await Promise.all([
      this.prisma.attendance_sessions.count({ where }),
      this.prisma.attendance_sessions.findMany({
        where,
        include: { ...SESSION_INCLUDE, _count: { select: { attendance_records: true } } },
        orderBy,
        skip,
        take,
      }),
    ]);
    return normalize({ total, rows });
  }

  async sessionSetStatus(id, { statusId, openedAt, closedAt }) {
    return run(
      this.prisma.attendance_sessions.update({
        where: whereId(id),
        data: clean({
          attendance_status_id: statusId === undefined ? undefined : bigId(statusId),
          opened_at: openedAt,
          closed_at: closedAt,
        }),
        include: SESSION_INCLUDE,
      }),
    ).then(normalize);
  }

  // Solo `topics`: ningún otro campo de la sesión puede cambiarse por aquí.
  async sessionSetTopics(id, topics) {
    return run(
      this.prisma.attendance_sessions.update({
        where: whereId(id),
        data: { topics },
        include: SESSION_INCLUDE,
      }),
    ).then(normalize);
  }

  // Asigna un código único con reintentos ante colisión (P2002).
  async sessionSetCode(id, attempts = 5) {
    let lastError = null;
    for (let i = 0; i < attempts; i += 1) {
      try {
        return await this.prisma.attendance_sessions
          .update({
            where: whereId(id),
            data: { attendance_code: generateAttendanceCode() },
            include: SESSION_INCLUDE,
          })
          .then(normalize);
      } catch (error) {
        if (error?.code === "P2025") throw new AttendanceNotFoundError();
        if (error?.code !== "P2002") throw error;
        lastError = error;
      }
    }
    throw new AttendanceConflictError(lastError?.message);
  }

  async recordCreate({ sessionId, studentId, statusId, methodId, userId }) {
    return creating(
      this.prisma.attendance_records.create({
        data: clean({
          attendance_session_id: bigId(sessionId),
          student_id: bigId(studentId),
          attendance_status_id: bigId(statusId),
          registration_method_id: methodId === undefined ? undefined : bigId(methodId),
          registered_at: new Date(),
          is_manual: false,
          created_by_user_id: bigId(userId),
        }),
      }),
    ).then(normalize);
  }

  async recordListBySession(sessionId) {
    return this.prisma.attendance_records
      .findMany({
        where: { attendance_session_id: bigId(sessionId) },
        include: {
          students: { include: { persons: true } },
          attendance_statuses: { select: { code: true, name: true } },
          attendance_registration_methods: { select: { code: true, name: true } },
          // Snapshot + tipo para el acta: la columna FIRMA del PDF usa estos
          // datos reales (sin cambiar el esquema).
          attendance_record_signatures: {
            select: {
              id: true,
              signed_at: true,
              signature_snapshot: true,
              signatures: { select: { signature_type: true, signature_data: true } },
            },
          },
        },
        orderBy: { id: "asc" },
      })
      .then(normalize);
  }

  // Firmas del acta de una sesión (representante): solo lectura, sin
  // datos sensibles más allá de lo que el representante ya puede ver.
  async sessionSignatureList(sessionId) {
    return this.prisma.attendance_session_signatures
      .findMany({
        where: { attendance_session_id: bigId(sessionId) },
        include: {
          roles: { select: { name: true } },
          users: { select: { persons: { select: { first_name: true, middle_name: true, last_name: true, second_last_name: true } } } },
          signatures: { select: { signature_type: true, signature_data: true } },
        },
        orderBy: { signed_at: "asc" },
      })
      .then(normalize);
  }

  async signatureCreate({ personId, type, data, mime }) {
    return creating(
      this.prisma.signatures.create({
        data: clean({
          person_id: bigId(personId),
          signature_type: type,
          signature_data: data,
          mime_type: mime,
          status: "ACTIVE",
        }),
      }),
    ).then(normalize);
  }

  // Firma del asistente ligada a su registro (snapshot congelado).
  async recordSignatureCreate({ recordId, signatureId, snapshot }) {
    return creating(
      this.prisma.attendance_record_signatures.create({
        data: clean({
          attendance_record_id: bigId(recordId),
          signature_id: bigId(signatureId),
          signature_snapshot: snapshot,
        }),
      }),
    ).then(normalize);
  }

  async sessionSignatureCreate({ sessionId, userId, roleId, signatureId, snapshot }) {
    return creating(
      this.prisma.attendance_session_signatures.create({
        data: clean({
          attendance_session_id: bigId(sessionId),
          user_id: bigId(userId),
          role_id: bigId(roleId),
          signature_id: bigId(signatureId),
          signature_snapshot: snapshot,
        }),
      }),
    ).then(normalize);
  }
}

module.exports = { PrismaAttendanceStore };
