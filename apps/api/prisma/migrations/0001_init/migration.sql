-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "academic_groups" (
    "id" BIGSERIAL NOT NULL,
    "program_id" BIGINT NOT NULL,
    "academic_period_id" BIGINT NOT NULL,
    "academic_level_id" BIGINT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "code" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_levels" (
    "id" BIGSERIAL NOT NULL,
    "number" SMALLINT NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "academic_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_periods" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "year" SMALLINT NOT NULL,
    "term" SMALLINT NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_programs" (
    "id" BIGSERIAL NOT NULL,
    "faculty_id" BIGINT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "code" VARCHAR(50),
    "modality" VARCHAR(50),
    "duration_semesters" SMALLINT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_record_signatures" (
    "id" BIGSERIAL NOT NULL,
    "attendance_record_id" BIGINT NOT NULL,
    "signature_id" BIGINT NOT NULL,
    "signature_snapshot" TEXT,
    "signed_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_record_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" BIGSERIAL NOT NULL,
    "attendance_session_id" BIGINT NOT NULL,
    "student_id" BIGINT NOT NULL,
    "attendance_status_id" BIGINT NOT NULL,
    "registration_method_id" BIGINT,
    "registered_at" TIMESTAMP(0),
    "is_manual" BOOLEAN NOT NULL DEFAULT false,
    "manual_reason" VARCHAR(500),
    "created_by_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_registration_methods" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "attendance_registration_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_session_signatures" (
    "id" BIGSERIAL NOT NULL,
    "attendance_session_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "signature_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "signature_snapshot" TEXT,
    "signed_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_session_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_sessions" (
    "id" BIGSERIAL NOT NULL,
    "course_offering_id" BIGINT NOT NULL,
    "teacher_user_id" BIGINT NOT NULL,
    "representative_user_id" BIGINT NOT NULL,
    "attendance_status_id" BIGINT NOT NULL,
    "session_date" DATE NOT NULL,
    "start_time" TIME(0) NOT NULL,
    "end_time" TIME(0) NOT NULL,
    "opened_at" TIMESTAMP(0),
    "closed_at" TIMESTAMP(0),
    "attendance_code" VARCHAR(50),
    "topics" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_statuses" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "attendance_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" BIGINT,
    "description" VARCHAR(1000),
    "metadata" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_offerings" (
    "id" BIGSERIAL NOT NULL,
    "curriculum_subject_id" BIGINT NOT NULL,
    "academic_period_id" BIGINT NOT NULL,
    "group_id" BIGINT NOT NULL,
    "cds" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_offerings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curricula" (
    "id" BIGSERIAL NOT NULL,
    "program_id" BIGINT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "code" VARCHAR(50),
    "version" VARCHAR(30),
    "effective_from" DATE,
    "effective_until" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_subjects" (
    "id" BIGSERIAL NOT NULL,
    "curriculum_id" BIGINT NOT NULL,
    "subject_id" BIGINT NOT NULL,
    "academic_level_id" BIGINT NOT NULL,
    "subject_type" VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
    "credits" DECIMAL(4,2),
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "position" SMALLINT,

    CONSTRAINT "curriculum_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculties" (
    "id" BIGSERIAL NOT NULL,
    "institution_id" BIGINT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "code" VARCHAR(30),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_students" (
    "id" BIGSERIAL NOT NULL,
    "group_id" BIGINT NOT NULL,
    "student_id" BIGINT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(0),

    CONSTRAINT "group_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identification_types" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "identification_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutions" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "code" VARCHAR(30),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persons" (
    "id" BIGSERIAL NOT NULL,
    "identification_type_id" BIGINT NOT NULL,
    "identification_number" VARCHAR(50) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "middle_name" VARCHAR(100),
    "last_name" VARCHAR(100) NOT NULL,
    "second_last_name" VARCHAR(100),
    "email" VARCHAR(200),
    "phone" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "representative_assignments" (
    "id" BIGSERIAL NOT NULL,
    "group_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "academic_period_id" BIGINT NOT NULL,
    "assigned_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(0),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "representative_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signatures" (
    "id" BIGSERIAL NOT NULL,
    "person_id" BIGINT NOT NULL,
    "signature_type" VARCHAR(30) NOT NULL,
    "storage_path" VARCHAR(500),
    "mime_type" VARCHAR(100),
    "signature_data" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" BIGSERIAL NOT NULL,
    "person_id" BIGINT NOT NULL,
    "student_code" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_prerequisites" (
    "id" BIGSERIAL NOT NULL,
    "curriculum_subject_id" BIGINT NOT NULL,
    "prerequisite_subject_id" BIGINT NOT NULL,

    CONSTRAINT "subject_prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "credits" DECIMAL(4,2),
    "hours_theoretical" DECIMAL(5,2),
    "hours_practical" DECIMAL(5,2),
    "hours_independent" DECIMAL(5,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teaching_assignments" (
    "id" BIGSERIAL NOT NULL,
    "course_offering_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "assigned_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(0),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "teaching_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "person_id" BIGINT NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_groups_level" ON "academic_groups"("academic_level_id");

-- CreateIndex
CREATE INDEX "idx_groups_period" ON "academic_groups"("academic_period_id");

-- CreateIndex
CREATE INDEX "idx_groups_program" ON "academic_groups"("program_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_group_period_name" ON "academic_groups"("program_id", "academic_period_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_academic_levels_number" ON "academic_levels"("number");

-- CreateIndex
CREATE UNIQUE INDEX "uq_academic_levels_name" ON "academic_levels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_academic_periods_name" ON "academic_periods"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_academic_periods_year_term" ON "academic_periods"("year", "term");

-- CreateIndex
CREATE UNIQUE INDEX "uq_programs_code" ON "academic_programs"("code");

-- CreateIndex
CREATE INDEX "idx_programs_faculty" ON "academic_programs"("faculty_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_programs_faculty_name" ON "academic_programs"("faculty_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_record_signature" ON "attendance_record_signatures"("attendance_record_id");

-- CreateIndex
CREATE INDEX "idx_record_signature_signature" ON "attendance_record_signatures"("signature_id");

-- CreateIndex
CREATE INDEX "idx_attendance_record_creator" ON "attendance_records"("created_by_user_id");

-- CreateIndex
CREATE INDEX "idx_attendance_record_method" ON "attendance_records"("registration_method_id");

-- CreateIndex
CREATE INDEX "idx_attendance_records_session" ON "attendance_records"("attendance_session_id");

-- CreateIndex
CREATE INDEX "idx_attendance_records_status" ON "attendance_records"("attendance_status_id");

-- CreateIndex
CREATE INDEX "idx_attendance_records_student" ON "attendance_records"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_attendance_record_student" ON "attendance_records"("attendance_session_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_registration_method_code" ON "attendance_registration_methods"("code");

-- CreateIndex
CREATE UNIQUE INDEX "uq_registration_method_name" ON "attendance_registration_methods"("name");

-- CreateIndex
CREATE INDEX "idx_session_signature_role" ON "attendance_session_signatures"("role_id");

-- CreateIndex
CREATE INDEX "idx_session_signature_signature" ON "attendance_session_signatures"("signature_id");

-- CreateIndex
CREATE INDEX "idx_session_signatures_session" ON "attendance_session_signatures"("attendance_session_id");

-- CreateIndex
CREATE INDEX "idx_session_signatures_user" ON "attendance_session_signatures"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_session_signature_role" ON "attendance_session_signatures"("attendance_session_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_attendance_code" ON "attendance_sessions"("attendance_code");

-- CreateIndex
CREATE INDEX "idx_attendance_sessions_course" ON "attendance_sessions"("course_offering_id");

-- CreateIndex
CREATE INDEX "idx_attendance_sessions_date" ON "attendance_sessions"("session_date");

-- CreateIndex
CREATE INDEX "idx_attendance_sessions_representative" ON "attendance_sessions"("representative_user_id");

-- CreateIndex
CREATE INDEX "idx_attendance_sessions_status" ON "attendance_sessions"("attendance_status_id");

-- CreateIndex
CREATE INDEX "idx_attendance_sessions_teacher" ON "attendance_sessions"("teacher_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_attendance_session_time" ON "attendance_sessions"("course_offering_id", "session_date", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "uq_attendance_status_code" ON "attendance_statuses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "uq_attendance_status_name" ON "attendance_statuses"("name");

-- CreateIndex
CREATE INDEX "idx_audit_action" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "idx_audit_created" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_audit_entity" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_audit_user" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_course_offerings_group" ON "course_offerings"("group_id");

-- CreateIndex
CREATE INDEX "idx_course_offerings_period" ON "course_offerings"("academic_period_id");

-- CreateIndex
CREATE INDEX "idx_course_offerings_subject" ON "course_offerings"("curriculum_subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_course_offering" ON "course_offerings"("curriculum_subject_id", "academic_period_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_curricula_code" ON "curricula"("code");

-- CreateIndex
CREATE INDEX "idx_curricula_program" ON "curricula"("program_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_curricula_program_name" ON "curricula"("program_id", "name");

-- CreateIndex
CREATE INDEX "idx_curriculum_subjects_curriculum" ON "curriculum_subjects"("curriculum_id");

-- CreateIndex
CREATE INDEX "idx_curriculum_subjects_level" ON "curriculum_subjects"("academic_level_id");

-- CreateIndex
CREATE INDEX "idx_curriculum_subjects_subject" ON "curriculum_subjects"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_curriculum_subject" ON "curriculum_subjects"("curriculum_id", "subject_id");

-- CreateIndex
CREATE INDEX "idx_faculties_institution" ON "faculties"("institution_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_faculties_institution_code" ON "faculties"("institution_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "uq_faculties_institution_name" ON "faculties"("institution_id", "name");

-- CreateIndex
CREATE INDEX "idx_group_students_group" ON "group_students"("group_id");

-- CreateIndex
CREATE INDEX "idx_group_students_student" ON "group_students"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_group_student" ON "group_students"("group_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_identification_types_code" ON "identification_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "uq_identification_types_name" ON "identification_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_institutions_code" ON "institutions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "uq_person_email" ON "persons"("email");

-- CreateIndex
CREATE INDEX "idx_persons_identification" ON "persons"("identification_number");

-- CreateIndex
CREATE UNIQUE INDEX "uq_person_identification" ON "persons"("identification_type_id", "identification_number");

-- CreateIndex
CREATE INDEX "idx_representative_assignment_group" ON "representative_assignments"("group_id");

-- CreateIndex
CREATE INDEX "idx_representative_assignment_period" ON "representative_assignments"("academic_period_id");

-- CreateIndex
CREATE INDEX "idx_representative_assignment_user" ON "representative_assignments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_representative_group_period" ON "representative_assignments"("group_id", "academic_period_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_representative_user_period" ON "representative_assignments"("user_id", "academic_period_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_roles_name" ON "roles"("name");

-- CreateIndex
CREATE INDEX "idx_signatures_person" ON "signatures"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_students_person" ON "students"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_students_code" ON "students"("student_code");

-- CreateIndex
CREATE INDEX "idx_required_subject" ON "subject_prerequisites"("prerequisite_subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_subject_prerequisite" ON "subject_prerequisites"("curriculum_subject_id", "prerequisite_subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_subjects_code" ON "subjects"("code");

-- CreateIndex
CREATE INDEX "idx_teaching_assignments_course" ON "teaching_assignments"("course_offering_id");

-- CreateIndex
CREATE INDEX "idx_teaching_assignments_user" ON "teaching_assignments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_teaching_assignment" ON "teaching_assignments"("course_offering_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_user_roles_role" ON "user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_role" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_person" ON "users"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_username" ON "users"("username");

-- AddForeignKey
ALTER TABLE "academic_groups" ADD CONSTRAINT "fk_groups_level" FOREIGN KEY ("academic_level_id") REFERENCES "academic_levels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "academic_groups" ADD CONSTRAINT "fk_groups_period" FOREIGN KEY ("academic_period_id") REFERENCES "academic_periods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "academic_groups" ADD CONSTRAINT "fk_groups_program" FOREIGN KEY ("program_id") REFERENCES "academic_programs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "academic_programs" ADD CONSTRAINT "fk_programs_faculty" FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendance_record_signatures" ADD CONSTRAINT "fk_record_signature_record" FOREIGN KEY ("attendance_record_id") REFERENCES "attendance_records"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendance_record_signatures" ADD CONSTRAINT "fk_record_signature_signature" FOREIGN KEY ("signature_id") REFERENCES "signatures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "fk_attendance_record_creator" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "fk_attendance_record_method" FOREIGN KEY ("registration_method_id") REFERENCES "attendance_registration_methods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "fk_attendance_record_session" FOREIGN KEY ("attendance_session_id") REFERENCES "attendance_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "fk_attendance_record_status" FOREIGN KEY ("attendance_status_id") REFERENCES "attendance_statuses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "fk_attendance_record_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendance_session_signatures" ADD CONSTRAINT "fk_session_signature_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendance_session_signatures" ADD CONSTRAINT "fk_session_signature_session" FOREIGN KEY ("attendance_session_id") REFERENCES "attendance_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendance_session_signatures" ADD CONSTRAINT "fk_session_signature_signature" FOREIGN KEY ("signature_id") REFERENCES "signatures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendance_session_signatures" ADD CONSTRAINT "fk_session_signature_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "fk_attendance_session_course" FOREIGN KEY ("course_offering_id") REFERENCES "course_offerings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "fk_attendance_session_representative" FOREIGN KEY ("representative_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "fk_attendance_session_status" FOREIGN KEY ("attendance_status_id") REFERENCES "attendance_statuses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "fk_attendance_session_teacher" FOREIGN KEY ("teacher_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "fk_audit_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "course_offerings" ADD CONSTRAINT "fk_course_offerings_group" FOREIGN KEY ("group_id") REFERENCES "academic_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "course_offerings" ADD CONSTRAINT "fk_course_offerings_period" FOREIGN KEY ("academic_period_id") REFERENCES "academic_periods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "course_offerings" ADD CONSTRAINT "fk_course_offerings_subject" FOREIGN KEY ("curriculum_subject_id") REFERENCES "curriculum_subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "curricula" ADD CONSTRAINT "fk_curricula_program" FOREIGN KEY ("program_id") REFERENCES "academic_programs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "curriculum_subjects" ADD CONSTRAINT "fk_curriculum_subjects_curriculum" FOREIGN KEY ("curriculum_id") REFERENCES "curricula"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "curriculum_subjects" ADD CONSTRAINT "fk_curriculum_subjects_level" FOREIGN KEY ("academic_level_id") REFERENCES "academic_levels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "curriculum_subjects" ADD CONSTRAINT "fk_curriculum_subjects_subject" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "faculties" ADD CONSTRAINT "fk_faculties_institution" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "group_students" ADD CONSTRAINT "fk_group_students_group" FOREIGN KEY ("group_id") REFERENCES "academic_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "group_students" ADD CONSTRAINT "fk_group_students_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "fk_persons_identification_type" FOREIGN KEY ("identification_type_id") REFERENCES "identification_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "representative_assignments" ADD CONSTRAINT "fk_representative_assignment_group" FOREIGN KEY ("group_id") REFERENCES "academic_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "representative_assignments" ADD CONSTRAINT "fk_representative_assignment_period" FOREIGN KEY ("academic_period_id") REFERENCES "academic_periods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "representative_assignments" ADD CONSTRAINT "fk_representative_assignment_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "signatures" ADD CONSTRAINT "fk_signatures_person" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "fk_students_person" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subject_prerequisites" ADD CONSTRAINT "fk_prerequisite_subject" FOREIGN KEY ("curriculum_subject_id") REFERENCES "curriculum_subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subject_prerequisites" ADD CONSTRAINT "fk_required_subject" FOREIGN KEY ("prerequisite_subject_id") REFERENCES "curriculum_subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "fk_teaching_assignments_course" FOREIGN KEY ("course_offering_id") REFERENCES "course_offerings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "fk_teaching_assignments_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "fk_user_roles_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "fk_user_roles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "fk_users_person" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ============================================================================
-- CHECK constraints recreados manualmente desde MySQL (Prisma no los modela).
-- Fuente: INFORMATION_SCHEMA de sistema_asistencia (solo lectura).
-- Traducción fiel: se eliminan introducers de charset (_utf8mb4/_latin1) y se
-- entrecomillan identificadores. La lógica de validación NO fue modificada.
-- ============================================================================

-- AddCheckConstraint
ALTER TABLE "academic_groups" ADD CONSTRAINT "chk_groups_status" CHECK ("status" in ('ACTIVE','INACTIVE','CLOSED'));

-- AddCheckConstraint
ALTER TABLE "academic_levels" ADD CONSTRAINT "chk_academic_levels_number" CHECK ("number" between 1 and 20);

-- AddCheckConstraint
ALTER TABLE "academic_periods" ADD CONSTRAINT "chk_academic_periods_dates" CHECK (("end_date" is null) or ("start_date" is null) or ("end_date" >= "start_date"));

-- AddCheckConstraint
ALTER TABLE "academic_periods" ADD CONSTRAINT "chk_academic_periods_status" CHECK ("status" in ('PLANNED','ACTIVE','CLOSED'));

-- AddCheckConstraint
ALTER TABLE "academic_periods" ADD CONSTRAINT "chk_academic_periods_term" CHECK ("term" in (1,2));

-- AddCheckConstraint
ALTER TABLE "academic_programs" ADD CONSTRAINT "chk_programs_duration" CHECK (("duration_semesters" is null) or ("duration_semesters" > 0));

-- AddCheckConstraint
ALTER TABLE "academic_programs" ADD CONSTRAINT "chk_programs_status" CHECK ("status" in ('ACTIVE','INACTIVE'));

-- AddCheckConstraint
ALTER TABLE "attendance_records" ADD CONSTRAINT "chk_manual_attendance_reason" CHECK (("is_manual" = false) or ("manual_reason" is not null));

-- AddCheckConstraint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "chk_attendance_session_opened" CHECK (("closed_at" is null) or ("opened_at" is null) or ("closed_at" >= "opened_at"));

-- AddCheckConstraint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "chk_attendance_session_time" CHECK ("end_time" > "start_time");

-- AddCheckConstraint
ALTER TABLE "course_offerings" ADD CONSTRAINT "chk_course_offerings_status" CHECK ("status" in ('PLANNED','ACTIVE','CLOSED','CANCELLED'));

-- AddCheckConstraint
ALTER TABLE "curricula" ADD CONSTRAINT "chk_curricula_dates" CHECK (("effective_until" is null) or ("effective_from" is null) or ("effective_until" >= "effective_from"));

-- AddCheckConstraint
ALTER TABLE "curricula" ADD CONSTRAINT "chk_curricula_status" CHECK ("status" in ('ACTIVE','INACTIVE'));

-- AddCheckConstraint
ALTER TABLE "curriculum_subjects" ADD CONSTRAINT "chk_curriculum_subjects_credits" CHECK (("credits" is null) or ("credits" >= 0));

-- AddCheckConstraint
ALTER TABLE "curriculum_subjects" ADD CONSTRAINT "chk_curriculum_subjects_type" CHECK ("subject_type" in ('NORMAL','ELECTIVE','PRACTICE','OTHER'));

-- AddCheckConstraint
ALTER TABLE "faculties" ADD CONSTRAINT "chk_faculties_status" CHECK ("status" in ('ACTIVE','INACTIVE'));

-- AddCheckConstraint
ALTER TABLE "group_students" ADD CONSTRAINT "chk_group_students_dates" CHECK (("left_at" is null) or ("left_at" >= "joined_at"));

-- AddCheckConstraint
ALTER TABLE "group_students" ADD CONSTRAINT "chk_group_students_status" CHECK ("status" in ('ACTIVE','INACTIVE'));

-- AddCheckConstraint
ALTER TABLE "institutions" ADD CONSTRAINT "chk_institutions_status" CHECK ("status" in ('ACTIVE','INACTIVE'));

-- AddCheckConstraint
ALTER TABLE "persons" ADD CONSTRAINT "chk_person_status" CHECK ("status" in ('ACTIVE','INACTIVE'));

-- AddCheckConstraint
ALTER TABLE "representative_assignments" ADD CONSTRAINT "chk_representative_dates" CHECK (("ended_at" is null) or ("ended_at" >= "assigned_at"));

-- AddCheckConstraint
ALTER TABLE "representative_assignments" ADD CONSTRAINT "chk_representative_status" CHECK ("status" in ('ACTIVE','INACTIVE'));

-- AddCheckConstraint
ALTER TABLE "signatures" ADD CONSTRAINT "chk_signature_status" CHECK ("status" in ('ACTIVE','INACTIVE'));

-- AddCheckConstraint
ALTER TABLE "signatures" ADD CONSTRAINT "chk_signature_type" CHECK ("signature_type" in ('DRAWN','TYPED','UPLOAD'));

-- AddCheckConstraint
ALTER TABLE "students" ADD CONSTRAINT "chk_students_status" CHECK ("status" in ('ACTIVE','INACTIVE','GRADUATED','WITHDRAWN'));

-- AddCheckConstraint
ALTER TABLE "subject_prerequisites" ADD CONSTRAINT "chk_subject_prerequisite_self" CHECK ("curriculum_subject_id" <> "prerequisite_subject_id");

-- AddCheckConstraint
ALTER TABLE "subjects" ADD CONSTRAINT "chk_subjects_credits" CHECK (("credits" is null) or ("credits" >= 0));

-- AddCheckConstraint
ALTER TABLE "subjects" ADD CONSTRAINT "chk_subjects_status" CHECK ("status" in ('ACTIVE','INACTIVE'));

-- AddCheckConstraint
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "chk_teaching_assignment_dates" CHECK (("ended_at" is null) or ("ended_at" >= "assigned_at"));

-- AddCheckConstraint
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "chk_teaching_assignment_status" CHECK ("status" in ('ACTIVE','INACTIVE'));

-- AddCheckConstraint
ALTER TABLE "users" ADD CONSTRAINT "chk_users_status" CHECK ("status" in ('ACTIVE','INACTIVE','BLOCKED'));
