-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "family_id" VARCHAR(36) NOT NULL,
    "replaced_by_hash" VARCHAR(64),
    "expires_at" TIMESTAMP(0) NOT NULL,
    "revoked_at" TIMESTAMP(0),
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_auth_session_token" ON "auth_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "idx_auth_session_user" ON "auth_sessions"("user_id");

-- CreateIndex
CREATE INDEX "idx_auth_session_family" ON "auth_sessions"("family_id");

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "fk_auth_session_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
