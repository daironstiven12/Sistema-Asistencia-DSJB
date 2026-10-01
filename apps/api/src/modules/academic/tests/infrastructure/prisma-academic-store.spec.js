const { PrismaAcademicStore } = require("../../infrastructure/prisma-academic-store");
const {
  AcademicConflictError,
  AcademicInvalidReferenceError,
  AcademicNotFoundError,
} = require("../../application/academic-errors");

function prismaError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

describe("prisma-academic-store (prisma simulado)", () => {
  test("normaliza BigInt y Decimal y mapea ausencias", async () => {
    const calls = {};
    const prisma = {
      academic_programs: {
        findUnique: async (args) => {
          calls.find = args;
          return null;
        },
      },
    };
    const store = new PrismaAcademicStore(prisma);
    await expect(store.programGet("99")).rejects.toBeInstanceOf(
      AcademicNotFoundError,
    );
    expect(calls.find.where).toEqual({ id: BigInt(99) });
  });

  test("mapea duplicados, referencias y formatos de id", async () => {
    const prisma = {
      faculties: {
        create: async () => {
          throw prismaError("P2002");
        },
        findUnique: async () => ({
          id: BigInt(1),
          institution_id: BigInt(2),
          name: "F",
        }),
      },
      academic_programs: {
        create: async () => {
          throw prismaError("P2003");
        },
      },
    };
    const store = new PrismaAcademicStore(prisma);
    await expect(
      store.facultyCreate({ institutionId: "2", name: "F" }),
    ).rejects.toBeInstanceOf(AcademicConflictError);
    await expect(
      store.programCreate({ facultyId: "99", name: "P" }),
    ).rejects.toBeInstanceOf(AcademicInvalidReferenceError);
    const faculty = await store.facultyGet("1");
    expect(faculty).toEqual(
      expect.objectContaining({ id: "1", institution_id: "2", name: "F" }),
    );
  });

  test("ids malformados se tratan como inexistentes", async () => {
    const prisma = { subjects: { findUnique: async () => ({}) } };
    const store = new PrismaAcademicStore(prisma);
    await expect(store.subjectGet("abc")).rejects.toBeInstanceOf(
      AcademicNotFoundError,
    );
  });
});
