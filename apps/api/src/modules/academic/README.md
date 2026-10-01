# Módulo Academic — Dominio académico base

Administra la estructura curricular sin lógica de asistencia: instituciones, facultades, programas, planes de estudio, niveles, asignaturas, su ubicación en planes y prerrequisitos.

Primera etapa: `institutions`, `faculties`, `academic_programs`, `curricula`, `academic_levels`, `subjects`, `curriculum_subjects`, `subject_prerequisites`. La segunda etapa (periodos, grupos, oferta, asignaciones) usará estas entidades como base.

Escritura solo ADMINISTRADOR (`@Roles`); lectura para cualquier usuario autenticado. Cambios auditados (`academic.create/update/activate/deactivate/delete`). Respuestas normalizadas: ids como string y decimales como número.
