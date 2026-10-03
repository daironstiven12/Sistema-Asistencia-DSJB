const { ROLES } = require("../../../auth/domain/roles");
const { AttendanceForbiddenError } = require("../attendance-errors");

function toOffering(row) {
  return {
    courseOfferingId: String(row.id),
    subject: row.curriculum_subjects?.subjects?.name ?? "—",
    subjectCode: row.curriculum_subjects?.subjects?.code ?? "",
    group: row.academic_groups?.name ?? "—",
    period: row.academic_periods?.name ?? "",
    level: row.academic_groups?.academic_levels?.name ?? "",
    program: row.academic_groups?.academic_programs?.name ?? "",
  };
}

// Solo REPRESENTANTE, siempre sobre sus asignaciones reales.
// Sin representativeUserId en query/body: la identidad sale del JWT.
async function list({ userId, roles }, deps) {
  if (!(roles ?? []).includes(ROLES.REPRESENTANTE)) {
    throw new AttendanceForbiddenError();
  }
  const rows = await deps.store.offeringsForRepresentative(userId);
  return rows.map(toOffering);
}

module.exports = { list };
