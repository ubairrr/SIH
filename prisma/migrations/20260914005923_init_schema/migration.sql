-- CreateEnum
CREATE TYPE "Role" AS ENUM ('POLICE', 'FORENSICS', 'PROSECUTION', 'COURT', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "designation" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" BIGSERIAL NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetLabel" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Append-only enforcement (LOG-02, D-11) — hand-written, three layers.
-- See .planning/phases/01-login-user-management-tamper-proof-audit-log/01-RESEARCH.md
-- Pattern 2. Applied only via `prisma migrate deploy`, never `prisma db push`
-- (Pitfall 3 — `db push` silently ignores this hand-written SQL).

-- Layer 1: privilege revocation. Binds because Supabase's `postgres` role is
-- NOT a true Postgres superuser (superusers bypass ALL privilege checks;
-- ordinary owners can revoke their own DML privileges per Postgres docs).
REVOKE UPDATE, DELETE, TRUNCATE ON "AuditLog" FROM CURRENT_USER;
GRANT INSERT, SELECT ON "AuditLog" TO CURRENT_USER;

-- Layer 2: row-level trigger — covers UPDATE and DELETE.
CREATE OR REPLACE FUNCTION audit_log_no_row_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only: % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_block_update_delete
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION audit_log_no_row_mutation();

-- Layer 3: statement-level trigger — REQUIRED separately, row-level
-- triggers never fire for TRUNCATE (Postgres docs, sql-createtrigger.html).
CREATE OR REPLACE FUNCTION audit_log_no_truncate()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only: TRUNCATE is not permitted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_block_truncate
  BEFORE TRUNCATE ON "AuditLog"
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_no_truncate();
