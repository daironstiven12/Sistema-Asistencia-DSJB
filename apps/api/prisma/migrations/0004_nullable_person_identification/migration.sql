-- Permite registro básico sin identificación: identification_type_id e
-- identification_number pasan a NULLABLE. No se tocan tipos, FK, UNIQUE
-- ni datos existentes.
ALTER TABLE "persons" ALTER COLUMN "identification_type_id" DROP NOT NULL;
ALTER TABLE "persons" ALTER COLUMN "identification_number" DROP NOT NULL;
