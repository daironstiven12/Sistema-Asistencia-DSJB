const { registerStudent } = require("../../application/register-student");
const {
  EmailAlreadyRegisteredError,
  IdentificationAlreadyRegisteredError,
  InvalidRegistrationError,
} = require("../../application/auth-errors");
const { Argon2PasswordHasher } = require("../../infrastructure/argon2-password-hasher");

/* Directorio falso: refleja las unicidades reales (email, identificación,
   username) y la atomicidad de la creación anidada. */
function fakeDirectory(seed = {}) {
  const state = {
    idTypes: [{ id: "1", code: "CC", name: "Cédula" }],
    roles: [{ id: "9", name: "ESTUDIANTE" }],
    persons: [],
    users: [],
    students: [],
    userRoles: [],
    failOnCreate: false,
    ...seed,
  };
  return {
    state,
    async roleByName(name) {
      return state.roles.find((r) => r.name === name) ?? null;
    },
    async idTypeById(id) {
      return state.idTypes.find((t) => String(t.id) === String(id)) ?? null;
    },
    async emailTaken(email) {
      return state.persons.some((p) => p.email === email);
    },
    async identTaken(idTypeId, number) {
      return state.persons.some(
        (p) => String(p.identification_type_id) === String(idTypeId) && p.identification_number === number,
      );
    },
    async usernameTaken(username) {
      return state.users.some((u) => u.username === username);
    },
    async createStudentAccount(input) {
      if (state.failOnCreate) throw new Error("falla-inyectada");
      const person = {
        id: String(state.persons.length + 1),
        email: input.email,
        identification_type_id:
          input.identificationTypeId === null ? null : String(input.identificationTypeId),
        identification_number: input.identificationNumber,
        first_name: input.firstName,
        last_name: input.lastName,
      };
      const user = {
        id: String(state.users.length + 1),
        person_id: person.id,
        username: input.username,
        password_hash: input.passwordHash,
      };
      const student = { id: String(state.students.length + 1), person_id: person.id };
      state.persons.push(person);
      state.users.push(user);
      state.students.push(student);
      state.userRoles.push({ user_id: user.id, role_id: String(input.roleId) });
      return { userId: user.id };
    },
  };
}

const BASE = {
  email: "  Nueva.Estudiante@utch.edu.co ",
  password: "Clave-Segura-123",
  firstName: "Nueva",
  lastName: "Estudiante Apellido",
  identificationTypeId: "1",
  identificationNumber: " 987654 ",
  ip: "127.0.0.1",
  userAgent: "jest",
};

function makeDeps(directory) {
  const audits = [];
  return {
    deps: {
      directory,
      passwords: new Argon2PasswordHasher(),
      audit: { log: async (e) => audits.push(e) },
    },
    audits,
  };
}

describe("register-student", () => {
  test("registro correcto normaliza, asigna ESTUDIANTE y audita sin secretos", async () => {
    const directory = fakeDirectory();
    const { deps, audits } = makeDeps(directory);
    const out = await registerStudent(BASE, deps);
    expect(out).toEqual({
      id: "1",
      email: "nueva.estudiante@utch.edu.co",
      username: "nueva.estudiante",
      roles: ["ESTUDIANTE"],
    });
    expect(out.password).toBeUndefined();
    expect(out.passwordHash).toBeUndefined();
    const stored = directory.state.users[0];
    expect(stored.password_hash).not.toBe(BASE.password);
    expect(await deps.passwords.verify(stored.password_hash, "Clave-Segura-123")).toBe(true);
    expect(directory.state.persons[0]).toMatchObject({
      email: "nueva.estudiante@utch.edu.co",
      first_name: "Nueva",
      last_name: "Estudiante Apellido",
      identification_number: "987654",
    });
    expect(directory.state.students).toHaveLength(1);
    expect(directory.state.userRoles).toEqual([{ user_id: "1", role_id: "9" }]);
    expect(audits).toHaveLength(1);
    expect(audits[0].action).toBe("auth.register.student");
    expect(JSON.stringify(audits[0])).not.toMatch(/Clave-Segura-123|passwordHash/i);
  });

  test("registra estudiante sin identificación (NULL/NULL)", async () => {
    const directory = fakeDirectory();
    const { deps, audits } = makeDeps(directory);
    const { identificationTypeId, identificationNumber, ...basico } = BASE;
    const out = await registerStudent(basico, deps);
    expect(out.roles).toEqual(["ESTUDIANTE"]);
    expect(out.password).toBeUndefined();
    expect(out.passwordHash).toBeUndefined();
    expect(directory.state.persons[0]).toMatchObject({
      email: "nueva.estudiante@utch.edu.co",
      identification_type_id: null,
      identification_number: null,
    });
    expect(directory.state.students).toHaveLength(1);
    expect(directory.state.userRoles).toEqual([{ user_id: "1", role_id: "9" }]);
    expect(audits).toHaveLength(1);
    // Segundo registro sin identificación también funciona (NULL distintos).
    const otro = await registerStudent({ ...basico, email: "otro@utch.edu.co" }, deps);
    expect(otro.roles).toEqual(["ESTUDIANTE"]);
    expect(directory.state.persons).toHaveLength(2);
  });

  test("email duplicado → 409", async () => {
    const directory = fakeDirectory();
    const { deps } = makeDeps(directory);
    await registerStudent(BASE, deps);
    await expect(registerStudent(BASE, deps)).rejects.toBeInstanceOf(
      EmailAlreadyRegisteredError,
    );
    expect(directory.state.users).toHaveLength(1);
  });

  test("identificación duplicada → 409", async () => {
    const directory = fakeDirectory();
    const { deps } = makeDeps(directory);
    await registerStudent(BASE, deps);
    await expect(
      registerStudent({ ...BASE, email: "otra@utch.edu.co" }, deps),
    ).rejects.toBeInstanceOf(IdentificationAlreadyRegisteredError);
  });

  test("password de 5 caracteres → 400; de 6 → válido", async () => {
    const { deps } = makeDeps(fakeDirectory());
    await expect(
      registerStudent({ ...BASE, password: "abc12" }, deps),
    ).rejects.toBeInstanceOf(InvalidRegistrationError);
    const out = await registerStudent({ ...BASE, password: "abc123" }, deps);
    expect(out.roles).toEqual(["ESTUDIANTE"]);
  });

  test("password corta, tipo inexistente o vacío → 400", async () => {
    const { deps } = makeDeps(fakeDirectory());
    await expect(
      registerStudent({ ...BASE, password: "corta" }, deps),
    ).rejects.toBeInstanceOf(InvalidRegistrationError);
    await expect(
      registerStudent({ ...BASE, identificationTypeId: "99" }, deps),
    ).rejects.toBeInstanceOf(InvalidRegistrationError);
    await expect(
      registerStudent({ ...BASE, firstName: "  " }, deps),
    ).rejects.toBeInstanceOf(InvalidRegistrationError);
  });

  test("username colisionado genera sufijo sin romper unicidad", async () => {
    const directory = fakeDirectory();
    directory.state.users.push({ id: "7", username: "nueva.estudiante" });
    const { deps } = makeDeps(directory);
    const out = await registerStudent(BASE, deps);
    expect(out.username).toBe("nueva.estudiante-2");
  });

  test("fallo de creación no deja huérfanos", async () => {
    const directory = fakeDirectory({ failOnCreate: true });
    const { deps, audits } = makeDeps(directory);
    await expect(registerStudent(BASE, deps)).rejects.toThrow("falla-inyectada");
    expect(directory.state.persons).toHaveLength(0);
    expect(directory.state.users).toHaveLength(0);
    expect(directory.state.students).toHaveLength(0);
    expect(directory.state.userRoles).toHaveLength(0);
    expect(audits).toHaveLength(0);
  });
});
