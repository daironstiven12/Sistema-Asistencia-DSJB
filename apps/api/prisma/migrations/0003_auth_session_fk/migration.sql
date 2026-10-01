-- DropForeignKey
ALTER TABLE "auth_sessions" DROP CONSTRAINT "fk_auth_session_user";

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "fk_auth_session_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
