const {
  AttendanceConflictError,
  AttendanceNotFoundError,
} = require("../../application/attendance-errors");
const { generateAttendanceCode } = require("../../domain/attendance-status");

function fakeAttendanceStore() {
  const tables = {
    statuses: new Map(),
    methods: new Map(),
    roles: new Map(),
    offerings: new Map(),
    assignments: [],
    teachers: [],
    users: new Map(),
    persons: new Map(),
    students: new Map(),
    memberships: [],
    sessions: new Map(),
    records: [],
    recordSignatures: [],
    signatures: new Map(),
    sessionSignatures: [],
  };
  const counters = {};
  const nextId = (entity) => {
    counters[entity] = (counters[entity] ?? 0) + 1;
    return String(counters[entity]);
  };

  function statusRow(code) {
    return { id: code, code, name: code };
  }

  function sessionView(row) {
    const status = tables.statuses.get(String(row.attendance_status_id)) ?? { code: "BORRADOR" };
    const offering = tables.offerings.get(String(row.course_offering_id)) ?? {};
    return {
      ...row,
      attendance_statuses: { code: status.code ?? status, name: status.code ?? status },
      course_offerings: {
        id: row.course_offering_id,
        group_id: offering.group_id,
        academic_period_id: offering.academic_period_id,
      },
    };
  }

  return {
    tables,
    seed(entity, rows) {
      rows.forEach((row) => {
        const id = row.id ?? nextId(entity);
        if (entity === "assignments" || entity === "teachers" || entity === "memberships" || entity === "records" || entity === "recordSignatures" || entity === "sessionSignatures") {
          tables[entity].push({ id: String(id), ...row });
        } else {
          tables[entity].set(String(id), { id: String(id), ...row });
        }
      });
    },

    async statusByCode(code) {
      if (!tables.statuses.has(code)) tables.statuses.set(code, statusRow(code));
      return { ...tables.statuses.get(code) };
    },
    async methodByCode(code, name) {
      if (!tables.methods.has(code)) tables.methods.set(code, { id: `m-${code}`, code, name: name ?? code });
      return { ...tables.methods.get(code) };
    },
    async roleByName(name) {
      const row = [...tables.roles.values()].find((r) => r.name === name);
      if (!row) throw new AttendanceNotFoundError();
      return { ...row };
    },
    async offeringGet(id) {
      const row = tables.offerings.get(String(id));
      if (!row) throw new AttendanceNotFoundError();
      return { ...row };
    },
    async assignmentFor({ userId, groupId, periodId }) {
      return (
        tables.assignments.find(
          (a) =>
            String(a.user_id) === String(userId) &&
            String(a.group_id) === String(groupId) &&
            String(a.academic_period_id) === String(periodId) &&
            (a.status ?? "ACTIVE") === "ACTIVE",
        ) ?? null
      );
    },
    async teacherForOffering(offeringId) {
      return (
        tables.teachers.find(
          (t) =>
            String(t.course_offering_id) === String(offeringId) &&
            (t.status ?? "ACTIVE") === "ACTIVE",
        ) ?? null
      );
    },
    async studentOfUser(userId) {
      const user = tables.users.get(String(userId));
      if (!user) throw new AttendanceNotFoundError();
      const student = [...tables.students.values()].find(
        (s) => String(s.person_id) === String(user.person_id),
      );
      return student ? { ...student } : null;
    },
    async personOfUser(userId) {
      const user = tables.users.get(String(userId));
      if (!user) throw new AttendanceNotFoundError();
      return { id: String(user.person_id) };
    },
    async personByIdentificationNumber(identificationNumber) {
      const row = [...tables.persons.values()].find(
        (p) => String(p.identification_number) === String(identificationNumber),
      );
      return row ? { ...row } : null;
    },
    async personCreate({ firstName, middleName, lastName, secondLastName, identificationNumber }) {
      const id = nextId("persons");
      const row = {
        id,
        first_name: firstName,
        middle_name: middleName ?? null,
        last_name: lastName,
        second_last_name: secondLastName ?? null,
        identification_number: identificationNumber,
      };
      tables.persons.set(id, row);
      return { ...row };
    },
    async studentOfPerson(personId) {
      const row = [...tables.students.values()].find(
        (s) => String(s.person_id) === String(personId),
      );
      return row ? { ...row } : null;
    },
    async studentCreate({ personId }) {
      const id = nextId("students");
      const row = { id, person_id: String(personId), status: "ACTIVE" };
      tables.students.set(id, row);
      return { ...row };
    },
    async membership({ studentId, groupId }) {
      return (
        tables.memberships.find(
          (m) => String(m.student_id) === String(studentId) && String(m.group_id) === String(groupId),
        ) ?? null
      );
    },
    async offeringsForRepresentative(userId) {
      const mine = tables.assignments.filter(
        (a) =>
          String(a.user_id) === String(userId) && (a.status ?? "ACTIVE") === "ACTIVE",
      );
      if (mine.length === 0) return [];
      const pairs = new Set(mine.map((a) => `${a.group_id}|${a.academic_period_id}`));
      return [...tables.offerings.values()]
        .filter(
          (o) =>
            (o.status ?? "ACTIVE") === "ACTIVE" &&
            pairs.has(`${o.group_id}|${o.academic_period_id}`),
        )
        .map((o) => ({
          id: o.id,
          curriculum_subjects: {
            subjects: { code: o.subjectCode ?? null, name: o.subject ?? "—" },
          },
          academic_groups: {
            name: o.group ?? "—",
            academic_levels: { name: o.level ?? "" },
            academic_programs: { name: o.program ?? "" },
          },
          academic_periods: { name: o.period ?? "" },
        }));
    },
    async sessionCreate(data) {
      const id = nextId("sessions");
      const row = {
        id,
        attendance_code: null,
        opened_at: null,
        closed_at: null,
        course_offering_id: data.courseOfferingId,
        teacher_user_id: data.teacherUserId,
        representative_user_id: data.representativeUserId,
        attendance_status_id: data.statusId,
        session_date: data.sessionDate,
        start_time: data.startTime,
        end_time: data.endTime,
        topics: data.topics,
      };
      tables.sessions.set(id, row);
      return sessionView({ ...row });
    },
    async sessionGet(id) {
      const row = tables.sessions.get(String(id));
      if (!row) throw new AttendanceNotFoundError();
      return sessionView({ ...row });
    },
    async sessionByCode(code) {
      const row = [...tables.sessions.values()].find((s) => s.attendance_code === String(code));
      return row ? sessionView({ ...row }) : null;
    },
    async sessionListByRepresentative(userId) {
      return [...tables.sessions.values()]
        .filter((s) => String(s.representative_user_id) === String(userId))
        .map((s) => sessionView({ ...s }));
    },
    async sessionListAll() {
      return [...tables.sessions.values()].map((s) => sessionView({ ...s }));
    },
    async representativeScope(userId) {
      return tables.assignments
        .filter(
          (a) =>
            String(a.user_id) === String(userId) && (a.status ?? "ACTIVE") === "ACTIVE",
        )
        .map((a) => ({ group_id: String(a.group_id), academic_period_id: String(a.academic_period_id) }));
    },
    async sessionHistory({ scope, status, from, to, courseOfferingId, search, skip, take }) {
      const q = String(search ?? "").trim().toLowerCase();
      const inScope = (s) => {
        if (!scope) return true;
        const offering = tables.offerings.get(String(s.course_offering_id)) ?? {};
        return scope.some(
          (a) =>
            String(a.group_id) === String(offering.group_id) &&
            String(a.academic_period_id) === String(offering.academic_period_id),
        );
      };
      const statusOf = (s) => {
        const row = tables.statuses.get(String(s.attendance_status_id));
        return row ? row.code : s.attendance_status_id;
      };
      const dateOf = (s) => new Date(s.session_date).getTime();
      const matchesSearch = (s) => {
        if (!q) return true;
        const offering = tables.offerings.get(String(s.course_offering_id)) ?? {};
        return [offering.subject, offering.subjectCode, offering.group]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      };
      const filtered = [...tables.sessions.values()].filter(
        (s) =>
          inScope(s) &&
          (status === undefined || statusOf(s) === status) &&
          (from === undefined || dateOf(s) >= new Date(from).getTime()) &&
          (to === undefined || dateOf(s) <= new Date(to).getTime()) &&
          (courseOfferingId === undefined || String(s.course_offering_id) === String(courseOfferingId)) &&
          matchesSearch(s),
      );
      filtered.sort((a, b) => {
        if (dateOf(b) !== dateOf(a)) return dateOf(b) - dateOf(a);
        const ta = String(a.start_time ?? "");
        const tb = String(b.start_time ?? "");
        if (tb !== ta) return tb < ta ? -1 : 1;
        return Number(b.id) - Number(a.id);
      });
      const rows = filtered.slice(skip, skip + take).map((s) => ({
        ...sessionView({ ...s }),
        _count: {
          attendance_records: tables.records.filter(
            (r) => String(r.attendance_session_id) === String(s.id),
          ).length,
        },
      }));
      return { total: filtered.length, rows };
    },
    async sessionSetStatus(id, { statusId, openedAt, closedAt }) {
      const row = tables.sessions.get(String(id));
      if (!row) throw new AttendanceNotFoundError();
      if (statusId !== undefined) row.attendance_status_id = statusId;
      if (openedAt !== undefined) row.opened_at = openedAt;
      if (closedAt !== undefined) row.closed_at = closedAt;
      return sessionView({ ...row });
    },
    async sessionSetTopics(id, topics) {
      const row = tables.sessions.get(String(id));
      if (!row) throw new AttendanceNotFoundError();
      row.topics = topics;
      return sessionView({ ...row });
    },
    async sessionSetCode(id) {
      const row = tables.sessions.get(String(id));
      if (!row) throw new AttendanceNotFoundError();
      row.attendance_code = generateAttendanceCode();
      return sessionView({ ...row });
    },
    async recordCreate(data) {
      const row = {
        id: nextId("records"),
        registered_at: new Date(),
        is_manual: false,
        attendance_session_id: data.sessionId,
        student_id: data.studentId,
        attendance_status_id: data.statusId,
        registration_method_id: data.methodId,
        created_by_user_id: data.userId,
      };
      const clash = tables.records.find(
        (r) =>
          String(r.attendance_session_id) === String(row.attendance_session_id) &&
          String(r.student_id) === String(row.student_id),
      );
      if (clash) throw new AttendanceConflictError();
      tables.records.push(row);
      return { ...row };
    },
    async recordListBySession(sessionId) {
      return tables.records
        .filter((r) => String(r.attendance_session_id) === String(sessionId))
        .map((r) => ({ ...r }));
    },
    async recordSignatureCreate({ recordId, signatureId, snapshot }) {
      const clash = tables.recordSignatures.find(
        (s) => String(s.attendance_record_id) === String(recordId),
      );
      if (clash) throw new AttendanceConflictError();
      const row = {
        id: nextId("recordSignatures"),
        attendance_record_id: String(recordId),
        signature_id: String(signatureId),
        signature_snapshot: snapshot ?? null,
        signed_at: new Date(),
      };
      tables.recordSignatures.push(row);
      return { ...row };
    },
    async signatureCreate(data) {
      const id = nextId("signatures");
      const row = {
        id,
        status: "ACTIVE",
        person_id: data.personId ?? data.person_id,
        signature_type: data.type ?? data.signature_type,
        signature_data: data.data ?? data.signature_data,
        mime_type: data.mime ?? data.mime_type ?? null,
      };
      tables.signatures.set(id, row);
      return { ...row };
    },
    async sessionSignatureCreate(data) {
      const row = {
        id: nextId("sessionSignatures"),
        signed_at: new Date(),
        attendance_session_id: data.sessionId,
        user_id: data.userId,
        role_id: data.roleId,
        signature_id: data.signatureId,
        signature_snapshot: data.snapshot,
      };
      const clash = tables.sessionSignatures.find(
        (s) =>
          String(s.attendance_session_id) === String(row.attendance_session_id) &&
          String(s.role_id) === String(row.role_id),
      );
      if (clash) throw new AttendanceConflictError();
      tables.sessionSignatures.push(row);
      return { ...row };
    },
    async sessionSignatureList(sessionId) {
      return tables.sessionSignatures
        .filter((s) => String(s.attendance_session_id) === String(sessionId))
        .map((s) => ({ ...s }));
    },
  };
}

module.exports = { fakeAttendanceStore };
