-- Compensating fix for a real, execution-time-verified gap in the append-only
-- enforcement added by 20260914005923_init_schema (LOG-02, D-11).
--
-- Finding (verified live against this project's actual Supabase instance,
-- not just reasoned about): the app's connecting role ("postgres") is a
-- MEMBER of Supabase's built-in `anon`, `authenticated`, and `service_role`
-- roles with INHERIT. Supabase's default-privileges setup on the `public`
-- schema auto-grants those three roles full `arwdDxtm` (including
-- UPDATE/DELETE/TRUNCATE) on every new table, for its PostgREST auto-API.
-- Because "postgres" inherits those grants, the original
-- `REVOKE ... FROM CURRENT_USER` in the init_schema migration did not
-- actually block UPDATE/DELETE/TRUNCATE — it only removed postgres's own
-- direct grant, while the inherited grant via role membership still applied.
-- Confirmed via live UPDATE/DELETE/TRUNCATE attempts against this table
-- before and after this fix.
--
-- This project never exposes `anon`/`authenticated` to any client (no
-- Supabase Auth, no PostgREST, no client-side RLS per CLAUDE.md) and
-- `service_role` is reserved for Supabase Storage operations on unrelated
-- objects (Phase 3) — revoking DML on "AuditLog" from all three is safe and
-- closes the gap. `anon`/`authenticated`/`service_role` do not exist on a
-- local Docker Postgres instance (offline mode), so each revoke is
-- conditional on the role existing; PUBLIC always exists and is revoked
-- unconditionally as a final backstop.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE UPDATE, DELETE, TRUNCATE ON "AuditLog" FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE UPDATE, DELETE, TRUNCATE ON "AuditLog" FROM authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'REVOKE UPDATE, DELETE, TRUNCATE ON "AuditLog" FROM service_role';
  END IF;
END $$;

REVOKE UPDATE, DELETE, TRUNCATE ON "AuditLog" FROM PUBLIC;
