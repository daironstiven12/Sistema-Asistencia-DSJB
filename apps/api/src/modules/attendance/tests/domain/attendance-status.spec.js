const {
  ABIERTA,
  BORRADOR,
  CERRADA,
  FIRMADA,
  assertTransition,
  generateAttendanceCode,
} = require("../../domain/attendance-status");

describe("attendance-status", () => {
  test("transiciones permitidas del flujo P0", () => {
    expect(assertTransition(BORRADOR, ABIERTA)).toBe(ABIERTA);
    expect(assertTransition(ABIERTA, CERRADA)).toBe(CERRADA);
    expect(assertTransition(CERRADA, FIRMADA)).toBe(FIRMADA);
  });

  test("transiciones inválidas fallan claro", () => {
    for (const [from, to] of [
      [BORRADOR, CERRADA],
      [ABIERTA, ABIERTA],
      [CERRADA, ABIERTA],
      [FIRMADA, ABIERTA],
      [ABIERTA, FIRMADA],
    ]) {
      let caught = null;
      try {
        assertTransition(from, to);
      } catch (error) {
        caught = error;
      }
      expect(caught).toMatchObject({ code: "INVALID_TRANSITION" });
    }
  });

  test("código único por sesión sin datos sensibles", () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateAttendanceCode()));
    expect(codes.size).toBe(200);
    for (const code of codes) {
      expect(code).toMatch(/^ASIS-[A-Z2-9]{8}$/);
    }
  });
});
