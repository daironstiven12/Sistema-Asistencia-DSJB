const { fakeAttendanceStore } = require("../helpers/fake-attendance-store");
const registrations = require("../../application/use-cases/registrations");
const {
  AttendanceForbiddenError,
  AttendanceInvalidReferenceError,
  AttendanceNotFoundError,
} = require("../../application/attendance-errors");

const ESTUDIANTE = { userId: "20", roles: ["ESTUDIANTE"] };
const REP = { userId: "10", roles: ["REPRESENTANTE"] };
const ADMIN = { userId: "99", roles: ["ADMINISTRADOR"] };

const FIRMA = {
  signatureType: "draw",
  signatureData: "data:image/png;base64,AAA",
  mimeType: "image/png",
};

function basePayload(extra = {}) {
  return {
    code: "ASIS-ABCDEFG",
    fullName: "Ana María Pérez Gómez",
    identificationNumber: " 1.112.223 ",
    ...FIRMA,
    ...ESTUDIANTE,
    actorId: "20",
    ...extra,
  };
}

function seeded(open = true) {
  const store = fakeAttendanceStore();
  store.seed("offerings", [{ id: "1", group_id: "7", academic_period_id: "3" }]);
  store.seed("users", [
    { id: "20", person_id: "100" },
    { id: "21", person_id: "101" },
    { id: "22", person_id: "102" },
  ]);
  store.seed("persons", [
    { id: "100", first_name: "Ana", last_name: "Pérez", identification_number: "1112223" },
    { id: "101", first_name: "Luis", last_name: "Mena", identification_number: "999" },
  ]);
  store.seed("students", [
    { id: "50", person_id: "100" },
    { id: "51", person_id: "101" },
  ]);
  // Sin membresías a propósito: group_students NO es requisito del registro.
  store.seed("statuses", [
    { id: "ABIERTA", code: "ABIERTA", name: "ABIERTA" },
    { id: "CERRADA", code: "CERRADA", name: "CERRADA" },
  ]);
  store.seed("sessions", [
    {
      id: "1",
      course_offering_id: "1",
      teacher_user_id: "30",
      representative_user_id: "10",
      attendance_status_id: open ? "ABIERTA" : "CERRADA",
      attendance_code: "ASIS-ABCDEFG",
    },
    {
      id: "2",
      course_offering_id: "1",
      teacher_user_id: "30",
      representative_user_id: "10",
      attendance_status_id: "ABIERTA",
      attendance_code: "ASIS-SECOND",
    },
  ]);
  return store;
}

function makeDeps(store) {
  const audits = [];
  return { deps: { store, audit: { log: async (e) => audits.push(e) } }, audits };
}

describe("registrations", () => {
  test("código válido + datos válidos crea persona, student, registro, firma y auditoría", async () => {
    const store = seeded();
    // Persona totalmente nueva: cédula sin puntos ni espacios tras normalizar.
    const { deps, audits } = makeDeps(store);
    const record = await registrations.register(
      basePayload({ identificationNumber: " 1.234.567 " }),
      deps,
    );
    expect(record.student_id).toBeDefined();
    expect(record.attendance_session_id).toBe("1");
    expect(record.attendance_status_id).toBe("PRESENTE");
    expect(record.registration_method_id).toBe("m-CODIGO");
    expect(record.registered_at).toBeDefined();
    expect(record.created_by_user_id).toBe("20");
    // Persona creada con el nombre dividido y la cédula normalizada.
    const person = await store.personByIdentificationNumber("1234567");
    expect(person).toMatchObject({
      first_name: "Ana",
      middle_name: "María",
      last_name: "Pérez",
      second_last_name: "Gómez",
      identification_number: "1234567",
    });
    const student = await store.studentOfPerson(person.id);
    expect(String(record.student_id)).toBe(String(student.id));
    // Firma creada y enlazada al registro con snapshot.
    expect(store.tables.signatures.size).toBe(1);
    const [signature] = [...store.tables.signatures.values()];
    expect(String(signature.person_id)).toBe(String(person.id));
    expect(store.tables.recordSignatures).toHaveLength(1);
    expect(String(store.tables.recordSignatures[0].attendance_record_id)).toBe(String(record.id));
    expect(store.tables.recordSignatures[0].signature_snapshot).toBe(FIRMA.signatureData);
    // Auditoría con trazabilidad, sin firma ni secretos.
    expect(audits.map((a) => a.action)).toEqual(["attendance.register"]);
    const audit = audits[0];
    expect(audit.entityType).toBe("attendance_record");
    expect(audit.entityId).toBe(record.id);
    expect(audit.metadata).toMatchObject({ identification_number: "1234567" });
    expect(JSON.stringify(audit)).not.toMatch(/password|jwt|secret|base64/i);
    // group_students no fue necesario.
    expect(store.tables.memberships).toHaveLength(0);
  });

  test("código incorrecto o sesión inexistente → 404", async () => {
    const { deps } = makeDeps(seeded());
    await expect(
      registrations.register(basePayload({ code: "ASIS-XXXXXXX" }), deps),
    ).rejects.toBeInstanceOf(AttendanceNotFoundError);
  });

  test("sesión cerrada rechaza el registro", async () => {
    const { deps } = makeDeps(seeded(false));
    await expect(registrations.register(basePayload(), deps)).rejects.toMatchObject({
      code: "CONFLICT",
      reason: "session-closed",
    });
  });

  test("sesión en borrador o firmada rechaza el registro", async () => {
    for (const [estado, reason] of [
      ["BORRADOR", "session-not-open"],
      ["FIRMADA", "session-closed"],
    ]) {
      const store = seeded();
      store.seed("statuses", [{ id: estado, code: estado, name: estado }]);
      const found = [...store.tables.sessions.values()][0];
      await store.sessionSetStatus(found.id, { statusId: estado });
      const { deps } = makeDeps(store);
      await expect(registrations.register(basePayload(), deps)).rejects.toMatchObject({
        code: "CONFLICT",
        reason,
      });
    }
  });

  test("nombre faltante o incompleto → 400", async () => {
    const { deps } = makeDeps(seeded());
    for (const fullName of ["", "   ", "X", "Ana"]) {
      await expect(
        registrations.register(basePayload({ fullName }), deps),
      ).rejects.toMatchObject({ code: "INVALID_REFERENCE", reason: "invalid-name" });
    }
    expect(storeCount(deps, "records")).toBe(0);
  });

  test("cédula faltante o inválida → 400", async () => {
    const { deps } = makeDeps(seeded());
    for (const identificationNumber of ["", "   ", "..", "!!", "ab"]) {
      await expect(
        registrations.register(basePayload({ identificationNumber }), deps),
      ).rejects.toMatchObject({ code: "INVALID_REFERENCE", reason: "invalid-identification" });
    }
    expect(storeCount(deps, "records")).toBe(0);
  });

  test("firma faltante o tipo inválido → 400", async () => {
    const { deps } = makeDeps(seeded());
    await expect(
      registrations.register(basePayload({ signatureType: "garabato" }), deps),
    ).rejects.toMatchObject({ code: "INVALID_REFERENCE", reason: "invalid-signature" });
    await expect(
      registrations.register(basePayload({ signatureData: "   " }), deps),
    ).rejects.toMatchObject({ code: "INVALID_REFERENCE", reason: "invalid-signature" });
    expect(storeCount(deps, "records")).toBe(0);
  });

  test("persona existente: reutiliza person/student sin sobrescribir nombres", async () => {
    const store = seeded();
    const { deps } = makeDeps(store);
    // La cédula 1112223 ya existe (Ana Pérez): se envía otro nombre.
    const record = await registrations.register(
      basePayload({ fullName: "Otra Persona Distinta", identificationNumber: "1112223" }),
      deps,
    );
    expect(String(record.student_id)).toBe("50");
    const person = await store.personByIdentificationNumber("1112223");
    expect(person).toMatchObject({ id: "100", first_name: "Ana", last_name: "Pérez" });
    expect(store.tables.persons.size).toBe(2);
  });

  test("doble registro con misma cédula en misma sesión → 409 sin duplicar", async () => {
    const store = seeded();
    const { deps } = makeDeps(store);
    await registrations.register(basePayload(), deps);
    await expect(registrations.register(basePayload(), deps)).rejects.toMatchObject({
      code: "CONFLICT",
      reason: "already-registered",
    });
    expect(store.tables.records).toHaveLength(1);
  });

  test("misma cédula en otra sesión → permitido", async () => {
    const store = seeded();
    const { deps } = makeDeps(store);
    await registrations.register(basePayload(), deps);
    const second = await registrations.register(basePayload({ code: "ASIS-SECOND" }), deps);
    expect(String(second.attendance_session_id)).toBe("2");
    expect(store.tables.records).toHaveLength(2);
  });

  test("actor cuya cédula coincide con su persona → reutiliza su student", async () => {
    const store = seeded();
    const { deps } = makeDeps(store);
    // user 20 → person 100 (cédula 1112223) → student 50.
    const record = await registrations.register(
      basePayload({ fullName: "Ana Pérez", identificationNumber: "1112223" }),
      deps,
    );
    expect(String(record.student_id)).toBe("50");
    expect(record.created_by_user_id).toBe("20");
  });

  test("actor con cédula distinta no altera sus datos personales", async () => {
    const store = seeded();
    const { deps } = makeDeps(store);
    // user 21 (person 101, Luis Mena) registra la cédula de Ana.
    const record = await registrations.register(
      basePayload({ identificationNumber: "1112223", actorId: "21", userId: "21" }),
      deps,
    );
    expect(String(record.student_id)).toBe("50");
    expect(record.created_by_user_id).toBe("21");
    const propia = await store.personByIdentificationNumber("999");
    expect(propia).toMatchObject({ id: "101", first_name: "Luis", last_name: "Mena" });
  });

  test("preview devuelve resumen mínimo de sesión ABIERTA", async () => {
    const store = seeded();
    const { deps } = makeDeps(store);
    const vista = await registrations.preview({ code: "ASIS-ABCDEFG" }, deps);
    expect(vista.code).toBe("ASIS-ABCDEFG");
    expect(JSON.stringify(vista)).not.toMatch(/identification|signature|student/i);
    await expect(registrations.preview({ code: "ASIS-NOPE" }, deps)).rejects.toBeInstanceOf(
      AttendanceNotFoundError,
    );
    const cerrada = seeded(false);
    await expect(
      registrations.preview({ code: "ASIS-ABCDEFG" }, makeDeps(cerrada).deps),
    ).rejects.toMatchObject({ code: "CONFLICT", reason: "session-closed" });
  });

  test("representante consulta sus registros; ajeno no", async () => {
    const store = seeded();
    const { deps } = makeDeps(store);
    await registrations.register(basePayload(), deps);
    const rows = await registrations.list({ sessionId: "1", ...REP }, deps);
    expect(rows).toHaveLength(1);
    await expect(
      registrations.list({ sessionId: "1", userId: "11", roles: ["REPRESENTANTE"] }, deps),
    ).rejects.toBeInstanceOf(AttendanceForbiddenError);
    const adminRows = await registrations.list({ sessionId: "1", ...ADMIN }, deps);
    expect(adminRows).toHaveLength(1);
    await expect(registrations.list({ sessionId: "99", ...REP }, deps)).rejects.toBeInstanceOf(
      AttendanceNotFoundError,
    );
  });

  function storeCount({ store }, table) {
    return store.tables[table].length ?? store.tables[table].size ?? 0;
  }
});
