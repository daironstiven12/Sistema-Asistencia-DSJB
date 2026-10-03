const { fakeAttendanceStore } = require("../helpers/fake-attendance-store");
const signatures = require("../../application/use-cases/signatures");
const {
  AttendanceConflictError,
  AttendanceForbiddenError,
  AttendanceNotFoundError,
} = require("../../application/attendance-errors");

const REP = { userId: "10", roles: ["REPRESENTANTE"] };

function seeded(status = "CERRADA") {
  const store = fakeAttendanceStore();
  store.seed("users", [{ id: "10", person_id: "100" }]);
  store.seed("roles", [{ id: "4", name: "REPRESENTANTE" }]);
  store.seed("statuses", [{ id: status, code: status, name: status }]);
  store.seed("sessions", [
    {
      id: "1",
      course_offering_id: "1",
      teacher_user_id: "30",
      representative_user_id: "10",
      attendance_status_id: status,
      attendance_code: "ASIS-ABCDEFG",
    },
  ]);
  return store;
}

function makeDeps(store) {
  const audits = [];
  return { deps: { store, audit: { log: async (e) => audits.push(e) } }, audits };
}

const BASE = {
  sessionId: "1",
  signatureType: "draw",
  signatureData: "data:image/png;base64,AAA",
  mimeType: "image/png",
  actorId: "10",
};

describe("signatures", () => {
  test("representante autorizado firma sesión cerrada → FIRMADA", async () => {
    const { deps, audits } = makeDeps(seeded());
    const out = await signatures.signSession({ ...BASE, ...REP }, deps);
    expect(out.signature.id).toBeDefined();
    expect(out.session.attendance_statuses.code).toBe("FIRMADA");
    expect(audits.map((a) => a.action)).toEqual(["attendance.sign"]);
  });

  test("representante ajeno no firma (403)", async () => {
    const { deps } = makeDeps(seeded());
    await expect(
      signatures.signSession(
        { ...BASE, userId: "11", roles: ["REPRESENTANTE"], actorId: "11" },
        deps,
      ),
    ).rejects.toBeInstanceOf(AttendanceForbiddenError);
  });

  test("sin autenticación efectiva no firma (403 por rol)", async () => {
    const { deps } = makeDeps(seeded());
    await expect(
      signatures.signSession({ ...BASE, userId: "10", roles: [], actorId: "10" }, deps),
    ).rejects.toBeInstanceOf(AttendanceForbiddenError);
  });

  test("sesión no cerrada no se firma (conflicto de transición)", async () => {
    const { deps } = makeDeps(seeded("ABIERTA"));
    await expect(signatures.signSession({ ...BASE, ...REP }, deps)).rejects.toMatchObject({
      code: "INVALID_TRANSITION",
    });
  });

  test("sesión inexistente 404", async () => {
    const { deps } = makeDeps(seeded());
    await expect(
      signatures.signSession({ ...BASE, sessionId: "99", ...REP }, deps),
    ).rejects.toBeInstanceOf(AttendanceNotFoundError);
  });

  test("doble firma del mismo rol → 409 por unicidad", async () => {
    const store = seeded();
    const { deps } = makeDeps(store);
    await signatures.signSession({ ...BASE, ...REP }, deps);
    // Se revierte solo el estado para aislar la restricción de unicidad.
    await store.sessionSetStatus("1", { statusId: "CERRADA" });
    await expect(signatures.signSession({ ...BASE, ...REP }, deps)).rejects.toBeInstanceOf(
      AttendanceConflictError,
    );
  });

  test("tipos del frontend se normalizan a chk_signature_type (DRAWN/TYPED/UPLOAD)", async () => {
    for (const [enviado, guardado] of [
      ["draw", "DRAWN"],
      ["DRAWN", "DRAWN"],
      ["type", "TYPED"],
      ["TYPED", "TYPED"],
      ["upload", "UPLOAD"],
    ]) {
      const { deps } = makeDeps(seeded());
      const out = await signatures.signSession(
        { ...BASE, signatureType: enviado, ...REP },
        deps,
      );
      expect(out.signature.signature_type).toBe(guardado);
    }
  });

  test("tipo de firma desconocido → 400 por referencia inválida", async () => {
    const { deps } = makeDeps(seeded());
    const { AttendanceInvalidReferenceError } = require("../../application/attendance-errors");
    await expect(
      signatures.signSession({ ...BASE, signatureType: "garabato", ...REP }, deps),
    ).rejects.toBeInstanceOf(AttendanceInvalidReferenceError);
  });

  test("sessionSignatures devuelve firmas con firmante y snapshot", async () => {
    const store = seeded();
    store.seed("sessionSignatures", [
      {
        id: "1",
        attendance_session_id: "1",
        signed_at: new Date("2026-10-02T10:00:00Z"),
        roles: { name: "REPRESENTANTE" },
        users: {
          persons: {
            first_name: "Jeanpier",
            middle_name: null,
            last_name: "Polanco",
            second_last_name: null,
          },
        },
        signatures: { signature_type: "DRAWN", signature_data: "data:image/png;base64,AAA" },
        signature_snapshot: "data:image/png;base64,AAA",
      },
    ]);
    const { deps } = makeDeps(store);
    const rows = await signatures.sessionSignatures({ sessionId: "1", ...REP }, deps);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      role: "REPRESENTANTE",
      signerName: "Jeanpier Polanco",
      signatureType: "DRAWN",
      snapshot: "data:image/png;base64,AAA",
    });
  });

  test("sessionSignatures: ajeno 403, inexistente 404, vacía []", async () => {
    const store = seeded();
    const { deps } = makeDeps(store);
    await expect(
      signatures.sessionSignatures(
        { sessionId: "1", userId: "11", roles: ["REPRESENTANTE"] },
        deps,
      ),
    ).rejects.toBeInstanceOf(AttendanceForbiddenError);
    await expect(
      signatures.sessionSignatures({ sessionId: "99", ...REP }, deps),
    ).rejects.toBeInstanceOf(AttendanceNotFoundError);
    await expect(
      signatures.sessionSignatures({ sessionId: "1", ...REP }, deps),
    ).resolves.toEqual([]);
  });
});
