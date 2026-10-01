CREATE DATABASE IF NOT EXISTS sistema_asistencia
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;

USE sistema_asistencia;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS attendance_session_signatures;
DROP TABLE IF EXISTS attendance_record_signatures;
DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS attendance_sessions;
DROP TABLE IF EXISTS attendance_statuses;
DROP TABLE IF EXISTS attendance_registration_methods;
DROP TABLE IF EXISTS teaching_assignments;
DROP TABLE IF EXISTS representative_assignments;
DROP TABLE IF EXISTS course_offerings;
DROP TABLE IF EXISTS group_students;
DROP TABLE IF EXISTS academic_groups;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS persons;
DROP TABLE IF EXISTS identification_types;
DROP TABLE IF EXISTS subject_prerequisites;
DROP TABLE IF EXISTS curriculum_subjects;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS academic_levels;
DROP TABLE IF EXISTS curricula;
DROP TABLE IF EXISTS academic_periods;
DROP TABLE IF EXISTS academic_programs;
DROP TABLE IF EXISTS faculties;
DROP TABLE IF EXISTS institutions;

SET FOREIGN_KEY_CHECKS = 1;


-- =========================================================
-- 1. INSTITUCIÓN
-- =========================================================

CREATE TABLE institutions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(30) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_institutions_code
        UNIQUE (code),

    CONSTRAINT chk_institutions_status
        CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;


-- =========================================================
-- 2. FACULTADES
-- =========================================================

CREATE TABLE faculties (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    institution_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(30) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_faculties_institution
        FOREIGN KEY (institution_id)
        REFERENCES institutions(id),

    CONSTRAINT uq_faculties_institution_name
        UNIQUE (institution_id, name),

    CONSTRAINT uq_faculties_institution_code
        UNIQUE (institution_id, code),

    CONSTRAINT chk_faculties_status
        CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE INDEX idx_faculties_institution
    ON faculties(institution_id);


-- =========================================================
-- 3. PROGRAMAS ACADÉMICOS
-- =========================================================

CREATE TABLE academic_programs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    faculty_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NULL,
    modality VARCHAR(50) NULL,
    duration_semesters TINYINT UNSIGNED NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_programs_faculty
        FOREIGN KEY (faculty_id)
        REFERENCES faculties(id),

    CONSTRAINT uq_programs_faculty_name
        UNIQUE (faculty_id, name),

    CONSTRAINT uq_programs_code
        UNIQUE (code),

    CONSTRAINT chk_programs_status
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    CONSTRAINT chk_programs_duration
        CHECK (
            duration_semesters IS NULL
            OR duration_semesters > 0
        )
) ENGINE=InnoDB;

CREATE INDEX idx_programs_faculty
    ON academic_programs(faculty_id);


-- =========================================================
-- 4. PLANES DE ESTUDIO
-- =========================================================

CREATE TABLE curricula (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    program_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NULL,
    version VARCHAR(30) NULL,
    effective_from DATE NULL,
    effective_until DATE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_curricula_program
        FOREIGN KEY (program_id)
        REFERENCES academic_programs(id),

    CONSTRAINT uq_curricula_program_name
        UNIQUE (program_id, name),

    CONSTRAINT uq_curricula_code
        UNIQUE (code),

    CONSTRAINT chk_curricula_status
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    CONSTRAINT chk_curricula_dates
        CHECK (
            effective_until IS NULL
            OR effective_from IS NULL
            OR effective_until >= effective_from
        )
) ENGINE=InnoDB;

CREATE INDEX idx_curricula_program
    ON curricula(program_id);


-- =========================================================
-- 5. NIVELES ACADÉMICOS
-- =========================================================

CREATE TABLE academic_levels (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    number TINYINT UNSIGNED NOT NULL,
    name VARCHAR(50) NOT NULL,

    CONSTRAINT uq_academic_levels_number
        UNIQUE (number),

    CONSTRAINT uq_academic_levels_name
        UNIQUE (name),

    CONSTRAINT chk_academic_levels_number
        CHECK (number BETWEEN 1 AND 20)
) ENGINE=InnoDB;


-- =========================================================
-- 6. ASIGNATURAS
-- =========================================================

CREATE TABLE subjects (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    credits DECIMAL(4,2) NULL,
    hours_theoretical DECIMAL(5,2) NULL,
    hours_practical DECIMAL(5,2) NULL,
    hours_independent DECIMAL(5,2) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_subjects_code
        UNIQUE (code),

    CONSTRAINT chk_subjects_status
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    CONSTRAINT chk_subjects_credits
        CHECK (
            credits IS NULL
            OR credits >= 0
        )
) ENGINE=InnoDB;


-- =========================================================
-- 7. ASIGNATURAS DEL PLAN DE ESTUDIOS
-- =========================================================

CREATE TABLE curriculum_subjects (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    curriculum_id BIGINT UNSIGNED NOT NULL,
    subject_id BIGINT UNSIGNED NOT NULL,
    academic_level_id BIGINT UNSIGNED NOT NULL,
    subject_type VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
    credits DECIMAL(4,2) NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    position SMALLINT UNSIGNED NULL,

    CONSTRAINT fk_curriculum_subjects_curriculum
        FOREIGN KEY (curriculum_id)
        REFERENCES curricula(id),

    CONSTRAINT fk_curriculum_subjects_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id),

    CONSTRAINT fk_curriculum_subjects_level
        FOREIGN KEY (academic_level_id)
        REFERENCES academic_levels(id),

    CONSTRAINT uq_curriculum_subject
        UNIQUE (curriculum_id, subject_id),

    CONSTRAINT chk_curriculum_subjects_type
        CHECK (
            subject_type IN (
                'NORMAL',
                'ELECTIVE',
                'PRACTICE',
                'OTHER'
            )
        ),

    CONSTRAINT chk_curriculum_subjects_credits
        CHECK (
            credits IS NULL
            OR credits >= 0
        )
) ENGINE=InnoDB;

CREATE INDEX idx_curriculum_subjects_curriculum
    ON curriculum_subjects(curriculum_id);

CREATE INDEX idx_curriculum_subjects_subject
    ON curriculum_subjects(subject_id);

CREATE INDEX idx_curriculum_subjects_level
    ON curriculum_subjects(academic_level_id);


-- =========================================================
-- 8. PRERREQUISITOS
-- =========================================================

CREATE TABLE subject_prerequisites (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    curriculum_subject_id BIGINT UNSIGNED NOT NULL,
    prerequisite_subject_id BIGINT UNSIGNED NOT NULL,

    CONSTRAINT fk_prerequisite_subject
        FOREIGN KEY (curriculum_subject_id)
        REFERENCES curriculum_subjects(id),

    CONSTRAINT fk_required_subject
        FOREIGN KEY (prerequisite_subject_id)
        REFERENCES curriculum_subjects(id),

    CONSTRAINT uq_subject_prerequisite
        UNIQUE (
            curriculum_subject_id,
            prerequisite_subject_id
        ),

    CONSTRAINT chk_subject_prerequisite_self
        CHECK (
            curriculum_subject_id <> prerequisite_subject_id
        )
) ENGINE=InnoDB;


-- =========================================================
-- 9. PERÍODOS ACADÉMICOS
-- =========================================================

CREATE TABLE academic_periods (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    year SMALLINT UNSIGNED NOT NULL,
    term TINYINT UNSIGNED NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_academic_periods_name
        UNIQUE (name),

    CONSTRAINT uq_academic_periods_year_term
        UNIQUE (year, term),

    CONSTRAINT chk_academic_periods_term
        CHECK (term IN (1, 2)),

    CONSTRAINT chk_academic_periods_status
        CHECK (
            status IN (
                'PLANNED',
                'ACTIVE',
                'CLOSED'
            )
        ),

    CONSTRAINT chk_academic_periods_dates
        CHECK (
            end_date IS NULL
            OR start_date IS NULL
            OR end_date >= start_date
        )
) ENGINE=InnoDB;


-- =========================================================
-- 10. TIPOS DE IDENTIFICACIÓN
-- =========================================================

CREATE TABLE identification_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,

    CONSTRAINT uq_identification_types_code
        UNIQUE (code),

    CONSTRAINT uq_identification_types_name
        UNIQUE (name)
) ENGINE=InnoDB;


-- =========================================================
-- 11. PERSONAS
-- =========================================================

CREATE TABLE persons (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    identification_type_id BIGINT UNSIGNED NOT NULL,
    identification_number VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NOT NULL,
    second_last_name VARCHAR(100) NULL,
    email VARCHAR(200) NULL,
    phone VARCHAR(50) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_persons_identification_type
        FOREIGN KEY (identification_type_id)
        REFERENCES identification_types(id),

    CONSTRAINT uq_person_identification
        UNIQUE (
            identification_type_id,
            identification_number
        ),

    CONSTRAINT uq_person_email
        UNIQUE (email),

    CONSTRAINT chk_person_status
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE'
            )
        )
) ENGINE=InnoDB;

CREATE INDEX idx_persons_identification
    ON persons(identification_number);


-- =========================================================
-- 12. USUARIOS
-- =========================================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    person_id BIGINT UNSIGNED NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_login_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_person
        FOREIGN KEY (person_id)
        REFERENCES persons(id),

    CONSTRAINT uq_users_person
        UNIQUE (person_id),

    CONSTRAINT uq_users_username
        UNIQUE (username),

    CONSTRAINT chk_users_status
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE',
                'BLOCKED'
            )
        )
) ENGINE=InnoDB;


-- =========================================================
-- 13. ROLES
-- =========================================================

CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,

    CONSTRAINT uq_roles_name
        UNIQUE (name)
) ENGINE=InnoDB;


-- =========================================================
-- 14. USUARIOS - ROLES
-- =========================================================

CREATE TABLE user_roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,

    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id),

    CONSTRAINT uq_user_role
        UNIQUE (user_id, role_id)
) ENGINE=InnoDB;


-- =========================================================
-- 15. ESTUDIANTES
-- =========================================================

CREATE TABLE students (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    person_id BIGINT UNSIGNED NOT NULL,
    student_code VARCHAR(50) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_students_person
        FOREIGN KEY (person_id)
        REFERENCES persons(id),

    CONSTRAINT uq_students_person
        UNIQUE (person_id),

    CONSTRAINT uq_students_code
        UNIQUE (student_code),

    CONSTRAINT chk_students_status
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE',
                'GRADUATED',
                'WITHDRAWN'
            )
        )
) ENGINE=InnoDB;


-- =========================================================
-- 16. GRUPOS ACADÉMICOS
-- =========================================================

CREATE TABLE academic_groups (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    program_id BIGINT UNSIGNED NOT NULL,
    academic_period_id BIGINT UNSIGNED NOT NULL,
    academic_level_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(50) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_groups_program
        FOREIGN KEY (program_id)
        REFERENCES academic_programs(id),

    CONSTRAINT fk_groups_period
        FOREIGN KEY (academic_period_id)
        REFERENCES academic_periods(id),

    CONSTRAINT fk_groups_level
        FOREIGN KEY (academic_level_id)
        REFERENCES academic_levels(id),

    CONSTRAINT uq_group_period_name
        UNIQUE (
            program_id,
            academic_period_id,
            name
        ),

    CONSTRAINT chk_groups_status
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE',
                'CLOSED'
            )
        )
) ENGINE=InnoDB;

CREATE INDEX idx_groups_program
    ON academic_groups(program_id);

CREATE INDEX idx_groups_period
    ON academic_groups(academic_period_id);

CREATE INDEX idx_groups_level
    ON academic_groups(academic_level_id);


-- =========================================================
-- 17. ESTUDIANTES - GRUPOS
-- =========================================================

CREATE TABLE group_students (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    left_at DATETIME NULL,

    CONSTRAINT fk_group_students_group
        FOREIGN KEY (group_id)
        REFERENCES academic_groups(id),

    CONSTRAINT fk_group_students_student
        FOREIGN KEY (student_id)
        REFERENCES students(id),

    CONSTRAINT uq_group_student
        UNIQUE (group_id, student_id),

    CONSTRAINT chk_group_students_status
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE'
            )
        ),

    CONSTRAINT chk_group_students_dates
        CHECK (
            left_at IS NULL
            OR left_at >= joined_at
        )
) ENGINE=InnoDB;

CREATE INDEX idx_group_students_group
    ON group_students(group_id);

CREATE INDEX idx_group_students_student
    ON group_students(student_id);


-- =========================================================
-- 18. OFERTA ACADÉMICA
-- =========================================================

CREATE TABLE course_offerings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    curriculum_subject_id BIGINT UNSIGNED NOT NULL,
    academic_period_id BIGINT UNSIGNED NOT NULL,
    group_id BIGINT UNSIGNED NOT NULL,
    cds VARCHAR(100) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_course_offerings_subject
        FOREIGN KEY (curriculum_subject_id)
        REFERENCES curriculum_subjects(id),

    CONSTRAINT fk_course_offerings_period
        FOREIGN KEY (academic_period_id)
        REFERENCES academic_periods(id),

    CONSTRAINT fk_course_offerings_group
        FOREIGN KEY (group_id)
        REFERENCES academic_groups(id),

    CONSTRAINT uq_course_offering
        UNIQUE (
            curriculum_subject_id,
            academic_period_id,
            group_id
        ),

    CONSTRAINT chk_course_offerings_status
        CHECK (
            status IN (
                'PLANNED',
                'ACTIVE',
                'CLOSED',
                'CANCELLED'
            )
        )
) ENGINE=InnoDB;

CREATE INDEX idx_course_offerings_subject
    ON course_offerings(curriculum_subject_id);

CREATE INDEX idx_course_offerings_period
    ON course_offerings(academic_period_id);

CREATE INDEX idx_course_offerings_group
    ON course_offerings(group_id);


-- =========================================================
-- 19. ASIGNACIÓN DE DOCENTES
-- =========================================================

CREATE TABLE teaching_assignments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_offering_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT fk_teaching_assignments_course
        FOREIGN KEY (course_offering_id)
        REFERENCES course_offerings(id),

    CONSTRAINT fk_teaching_assignments_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT uq_teaching_assignment
        UNIQUE (
            course_offering_id,
            user_id
        ),

    CONSTRAINT chk_teaching_assignment_status
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE'
            )
        ),

    CONSTRAINT chk_teaching_assignment_dates
        CHECK (
            ended_at IS NULL
            OR ended_at >= assigned_at
        )
) ENGINE=InnoDB;

CREATE INDEX idx_teaching_assignments_course
    ON teaching_assignments(course_offering_id);

CREATE INDEX idx_teaching_assignments_user
    ON teaching_assignments(user_id);


-- =========================================================
-- 20. ASIGNACIÓN DE REPRESENTANTES
-- =========================================================

CREATE TABLE representative_assignments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    academic_period_id BIGINT UNSIGNED NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT fk_representative_assignment_group
        FOREIGN KEY (group_id)
        REFERENCES academic_groups(id),

    CONSTRAINT fk_representative_assignment_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_representative_assignment_period
        FOREIGN KEY (academic_period_id)
        REFERENCES academic_periods(id),

    CONSTRAINT uq_representative_group_period
        UNIQUE (
            group_id,
            academic_period_id
        ),

    CONSTRAINT uq_representative_user_period
        UNIQUE (
            user_id,
            academic_period_id
        ),

    CONSTRAINT chk_representative_status
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE'
            )
        ),

    CONSTRAINT chk_representative_dates
        CHECK (
            ended_at IS NULL
            OR ended_at >= assigned_at
        )
) ENGINE=InnoDB;

CREATE INDEX idx_representative_assignment_group
    ON representative_assignments(group_id);

CREATE INDEX idx_representative_assignment_user
    ON representative_assignments(user_id);

CREATE INDEX idx_representative_assignment_period
    ON representative_assignments(academic_period_id);


-- =========================================================
-- 21. ESTADOS DE ASISTENCIA
-- =========================================================

CREATE TABLE attendance_statuses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,

    CONSTRAINT uq_attendance_status_code
        UNIQUE (code),

    CONSTRAINT uq_attendance_status_name
        UNIQUE (name)
) ENGINE=InnoDB;


-- =========================================================
-- 22. MÉTODOS DE REGISTRO
-- =========================================================

CREATE TABLE attendance_registration_methods (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,

    CONSTRAINT uq_registration_method_code
        UNIQUE (code),

    CONSTRAINT uq_registration_method_name
        UNIQUE (name)
) ENGINE=InnoDB;


-- =========================================================
-- 23. SESIONES DE ASISTENCIA
-- =========================================================

CREATE TABLE attendance_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_offering_id BIGINT UNSIGNED NOT NULL,
    teacher_user_id BIGINT UNSIGNED NOT NULL,
    representative_user_id BIGINT UNSIGNED NOT NULL,
    attendance_status_id BIGINT UNSIGNED NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    opened_at DATETIME NULL,
    closed_at DATETIME NULL,
    attendance_code VARCHAR(50) NULL,
    topics TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_attendance_session_course
        FOREIGN KEY (course_offering_id)
        REFERENCES course_offerings(id),

    CONSTRAINT fk_attendance_session_teacher
        FOREIGN KEY (teacher_user_id)
        REFERENCES users(id),

    CONSTRAINT fk_attendance_session_representative
        FOREIGN KEY (representative_user_id)
        REFERENCES users(id),

    CONSTRAINT fk_attendance_session_status
        FOREIGN KEY (attendance_status_id)
        REFERENCES attendance_statuses(id),

    CONSTRAINT uq_attendance_code
        UNIQUE (attendance_code),

    CONSTRAINT uq_attendance_session_time
        UNIQUE (
            course_offering_id,
            session_date,
            start_time
        ),

    CONSTRAINT chk_attendance_session_time
        CHECK (end_time > start_time),

    CONSTRAINT chk_attendance_session_opened
        CHECK (
            closed_at IS NULL
            OR opened_at IS NULL
            OR closed_at >= opened_at
        )
) ENGINE=InnoDB;

CREATE INDEX idx_attendance_sessions_course
    ON attendance_sessions(course_offering_id);

CREATE INDEX idx_attendance_sessions_teacher
    ON attendance_sessions(teacher_user_id);

CREATE INDEX idx_attendance_sessions_representative
    ON attendance_sessions(representative_user_id);

CREATE INDEX idx_attendance_sessions_date
    ON attendance_sessions(session_date);

CREATE INDEX idx_attendance_sessions_status
    ON attendance_sessions(attendance_status_id);


-- =========================================================
-- 24. REGISTROS DE ASISTENCIA
-- =========================================================

CREATE TABLE attendance_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    attendance_session_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NOT NULL,
    attendance_status_id BIGINT UNSIGNED NOT NULL,
    registration_method_id BIGINT UNSIGNED NULL,
    registered_at DATETIME NULL,
    is_manual BOOLEAN NOT NULL DEFAULT FALSE,
    manual_reason VARCHAR(500) NULL,
    created_by_user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_attendance_record_session
        FOREIGN KEY (attendance_session_id)
        REFERENCES attendance_sessions(id),

    CONSTRAINT fk_attendance_record_student
        FOREIGN KEY (student_id)
        REFERENCES students(id),

    CONSTRAINT fk_attendance_record_status
        FOREIGN KEY (attendance_status_id)
        REFERENCES attendance_statuses(id),

    CONSTRAINT fk_attendance_record_method
        FOREIGN KEY (registration_method_id)
        REFERENCES attendance_registration_methods(id),

    CONSTRAINT fk_attendance_record_creator
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    CONSTRAINT uq_attendance_record_student
        UNIQUE (
            attendance_session_id,
            student_id
        ),

    CONSTRAINT chk_manual_attendance_reason
        CHECK (
            is_manual = FALSE
            OR manual_reason IS NOT NULL
        )
) ENGINE=InnoDB;

CREATE INDEX idx_attendance_records_session
    ON attendance_records(attendance_session_id);

CREATE INDEX idx_attendance_records_student
    ON attendance_records(student_id);

CREATE INDEX idx_attendance_records_status
    ON attendance_records(attendance_status_id);


-- =========================================================
-- 25. FIRMAS
-- =========================================================

CREATE TABLE signatures (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    person_id BIGINT UNSIGNED NOT NULL,
    signature_type VARCHAR(30) NOT NULL,
    storage_path VARCHAR(500) NULL,
    mime_type VARCHAR(100) NULL,
    signature_data LONGTEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_signatures_person
        FOREIGN KEY (person_id)
        REFERENCES persons(id),

    CONSTRAINT chk_signature_type
        CHECK (
            signature_type IN (
                'DRAWN',
                'TYPED',
                'UPLOAD'
            )
        ),

    CONSTRAINT chk_signature_status
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE'
            )
        )
) ENGINE=InnoDB;

CREATE INDEX idx_signatures_person
    ON signatures(person_id);


-- =========================================================
-- 26. FIRMA UTILIZADA EN REGISTRO DEL ESTUDIANTE
-- =========================================================

CREATE TABLE attendance_record_signatures (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    attendance_record_id BIGINT UNSIGNED NOT NULL,
    signature_id BIGINT UNSIGNED NOT NULL,
    signature_snapshot LONGTEXT NULL,
    signed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_record_signature_record
        FOREIGN KEY (attendance_record_id)
        REFERENCES attendance_records(id),

    CONSTRAINT fk_record_signature_signature
        FOREIGN KEY (signature_id)
        REFERENCES signatures(id),

    CONSTRAINT uq_record_signature
        UNIQUE (attendance_record_id)
) ENGINE=InnoDB;


-- =========================================================
-- 27. FIRMAS DEL ACTA
-- =========================================================

CREATE TABLE attendance_session_signatures (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    attendance_session_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    signature_id BIGINT UNSIGNED NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    signature_snapshot LONGTEXT NULL,
    signed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_session_signature_session
        FOREIGN KEY (attendance_session_id)
        REFERENCES attendance_sessions(id),

    CONSTRAINT fk_session_signature_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_session_signature_signature
        FOREIGN KEY (signature_id)
        REFERENCES signatures(id),

    CONSTRAINT fk_session_signature_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id),

    CONSTRAINT uq_session_signature_role
        UNIQUE (
            attendance_session_id,
            role_id
        )
) ENGINE=InnoDB;

CREATE INDEX idx_session_signatures_session
    ON attendance_session_signatures(attendance_session_id);

CREATE INDEX idx_session_signatures_user
    ON attendance_session_signatures(user_id);


-- =========================================================
-- 28. AUDITORÍA
-- =========================================================

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT UNSIGNED NULL,
    description VARCHAR(1000) NULL,
    metadata JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_audit_user
    ON audit_logs(user_id);

CREATE INDEX idx_audit_entity
    ON audit_logs(entity_type, entity_id);

CREATE INDEX idx_audit_action
    ON audit_logs(action);

CREATE INDEX idx_audit_created
    ON audit_logs(created_at);


-- =========================================================
-- DATOS BASE DE CATÁLOGOS
-- =========================================================

INSERT INTO identification_types (code, name)
VALUES
    ('CC', 'Cédula de ciudadanía'),
    ('TI', 'Tarjeta de identidad'),
    ('CE', 'Cédula de extranjería'),
    ('PAS', 'Pasaporte');


INSERT INTO roles (name, description)
VALUES
    ('ADMINISTRADOR', 'Administrador general de la plataforma'),
    ('DOCENTE', 'Docente de la institución'),
    ('REPRESENTANTE', 'Representante académico del grupo'),
    ('ESTUDIANTE', 'Estudiante');


INSERT INTO attendance_statuses (code, name, description)
VALUES
    ('DRAFT', 'Borrador', 'Sesión creada pero no programada o publicada'),
    ('SCHEDULED', 'Programada', 'Sesión preparada para una fecha futura'),
    ('OPEN', 'Abierta', 'Los estudiantes pueden registrar asistencia'),
    ('CLOSED', 'Cerrada', 'La sesión ya no acepta registros normales'),
    ('VALIDATED', 'Validada', 'La asistencia fue revisada y validada'),
    ('SIGNED', 'Firmada', 'El acta cuenta con las firmas requeridas');


INSERT INTO attendance_registration_methods (code, name, description)
VALUES
    ('QR', 'Código QR', 'Registro mediante código QR'),
    ('CODE', 'Código manual', 'Registro mediante código de asistencia'),
    ('MANUAL', 'Registro manual', 'Registro realizado por un usuario autorizado');


-- =========================================================
-- NIVELES ACADÉMICOS
-- =========================================================

INSERT INTO academic_levels (number, name)
VALUES
    (1, 'I'),
    (2, 'II'),
    (3, 'III'),
    (4, 'IV'),
    (5, 'V'),
    (6, 'VI'),
    (7, 'VII'),
    (8, 'VIII'),
    (9, 'IX'),
    (10, 'X');