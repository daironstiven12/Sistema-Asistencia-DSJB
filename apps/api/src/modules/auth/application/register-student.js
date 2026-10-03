const { ROLES } = require("../domain/roles");
const { validate: validatePassword } = require("../domain/password-policy");
const {
  EmailAlreadyRegisteredError,
  IdentificationAlreadyRegisteredError,
  InvalidRegistrationError,
} = require("./auth-errors");

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeName(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

/* Username interno derivado del correo (local-part saneada). El login usa
   el email; el username solo mantiene la unicidad histórica de users. */
function baseUsername(email) {
  const local = String(email).split("@")[0] ?? "";
  const clean = local
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9._-]+/g, ".")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 60);
  return clean.length > 0 ? clean : "estudiante";
}

// Registro público de cuenta de estudiante. Crea Person → User → Student +
// rol ESTUDIANTE de forma atómica (creación anidada en el store). Nunca
// matricula: sin group_students ni ofertas. El rol jamás viene del cliente.
async function registerStudent(
  {
    email,
    password,
    firstName,
    lastName,
    identificationTypeId,
    identificationNumber,
    ip,
    userAgent,
  },
  deps,
) {
  const { directory, passwords, audit } = deps;
  const normalizedEmail = normalizeEmail(email);
  const normalizedFirst = normalizeName(firstName);
  const normalizedLast = normalizeName(lastName);
  const hasIdent =
    identificationTypeId !== undefined &&
    identificationTypeId !== null &&
    String(identificationTypeId).trim() !== "" &&
    identificationNumber !== undefined &&
    identificationNumber !== null &&
    String(identificationNumber).trim() !== "";
  const normalizedIdent = hasIdent ? String(identificationNumber).trim() : null;
  if (!normalizedEmail || !normalizedFirst || !normalizedLast) {
    throw new InvalidRegistrationError();
  }
  if (!validatePassword(password).ok) throw new InvalidRegistrationError();
  let idType = null;
  if (await directory.emailTaken(normalizedEmail)) throw new EmailAlreadyRegisteredError();
  if (hasIdent) {
    idType = await directory.idTypeById(identificationTypeId);
    if (!idType) throw new InvalidRegistrationError();
    if (await directory.identTaken(idType.id, normalizedIdent)) {
      throw new IdentificationAlreadyRegisteredError();
    }
  }
  const role = await directory.roleByName(ROLES.ESTUDIANTE);
  if (!role) throw new InvalidRegistrationError();
  let username = baseUsername(normalizedEmail);
  if (await directory.usernameTaken(username)) {
    let suffix = 2;
    let candidate = `${username}-${suffix}`;
    while (await directory.usernameTaken(candidate)) {
      suffix += 1;
      candidate = `${username}-${suffix}`;
    }
    username = candidate;
  }
  const passwordHash = await passwords.hash(password);
  const created = await directory.createStudentAccount({
    email: normalizedEmail,
    username,
    passwordHash,
    firstName: normalizedFirst,
    lastName: normalizedLast,
    identificationTypeId: idType ? idType.id : null,
    identificationNumber: normalizedIdent,
    roleId: role.id,
  });
  await audit.log({
    action: "auth.register.student",
    userId: created.userId,
    entityType: "user",
    entityId: created.userId,
    ip,
    userAgent,
  });
  return {
    id: created.userId,
    email: normalizedEmail,
    username,
    roles: [ROLES.ESTUDIANTE],
  };
}

module.exports = { registerStudent, normalizeEmail, baseUsername };
