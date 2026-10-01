const ACTIVE = "ACTIVE";
const INACTIVE = "INACTIVE";

const SUBJECT_TYPES = ["NORMAL", "ELECTIVE", "PRACTICE", "OTHER"];

function invalidValueError() {
  const error = new Error("valor_invalido");
  error.code = "INVALID_STATUS";
  return error;
}

function assertStatus(status) {
  if (status !== ACTIVE && status !== INACTIVE) {
    throw invalidValueError();
  }
  return status;
}

function assertSubjectType(type) {
  if (!SUBJECT_TYPES.includes(type)) {
    throw invalidValueError();
  }
  return type;
}

module.exports = { ACTIVE, INACTIVE, SUBJECT_TYPES, assertStatus, assertSubjectType };
