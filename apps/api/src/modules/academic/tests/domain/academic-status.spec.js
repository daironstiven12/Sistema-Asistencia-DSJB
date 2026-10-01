const {
  ACTIVE,
  INACTIVE,
  SUBJECT_TYPES,
  assertStatus,
  assertSubjectType,
} = require("../../domain/academic-status");

describe("academic-status", () => {
  test("estados y tipos válidos", () => {
    expect(assertStatus(ACTIVE)).toBe("ACTIVE");
    expect(assertStatus(INACTIVE)).toBe("INACTIVE");
    expect(assertSubjectType("NORMAL")).toBe("NORMAL");
    expect(SUBJECT_TYPES).toEqual(["NORMAL", "ELECTIVE", "PRACTICE", "OTHER"]);
  });

  test("rechaza valores fuera del modelo", () => {
    expect(() => assertStatus("ELIMINADO")).toThrow(
      expect.objectContaining({ code: "INVALID_STATUS" }),
    );
    expect(() => assertSubjectType("RARA")).toThrow(
      expect.objectContaining({ code: "INVALID_STATUS" }),
    );
  });
});
