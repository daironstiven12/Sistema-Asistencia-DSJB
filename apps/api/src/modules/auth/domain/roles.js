const ROLES = {
  ADMINISTRADOR: "ADMINISTRADOR",
  DOCENTE: "DOCENTE",
  ESTUDIANTE: "ESTUDIANTE",
  REPRESENTANTE: "REPRESENTANTE",
};

function isAdminRole(roles) {
  return (roles ?? []).includes(ROLES.ADMINISTRADOR);
}

module.exports = { ROLES, isAdminRole };
