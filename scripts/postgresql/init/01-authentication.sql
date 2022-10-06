
-- https://github.com/supabase/supabase/blob/master/docker/volumes/db/init/00-initial-schema.sql

CREATE USER administrator;
ALTER USER administrator WITH SUPERUSER CREATEDB CREATEROLE REPLICATION BYPASSRLS;

CREATE ROLE anon NOLOGIN NOINHERIT;
CREATE ROLE user_role NOLOGIN NOINHERIT;
CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;

CREATE USER authenticator NOINHERIT;
GRANT anon to authenticator;
GRANT user_role to authenticator;
GRANT service_role to authenticator;
GRANT administrator to authenticator;

GRANT USAGE ON SCHEMA public TO postgres, anon, user_role, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, user_role, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, user_role, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, user_role, service_role;

GRANT USAGE ON SCHEMA extensions TO postgres, anon, user_role, service_role;

ALTER USER administrator SET search_path TO public, extensions;

ALTER DEFAULT PRIVILEGES FOR USER administrator IN SCHEMA public
    GRANT ALL ON TABLES TO postgres, anon, user_role, service_role;
ALTER DEFAULT PRIVILEGES FOR USER administrator IN SCHEMA public
    GRANT ALL ON FUNCTIONS TO postgres, anon, user_role, service_role;
ALTER DEFAULT PRIVILEGES FOR USER administrator IN SCHEMA public
    GRANT ALL ON SEQUENCES TO postgres, anon, user_role, service_role;

ALTER ROLE anon SET statement_timeout = '5s';
ALTER ROLE user_role SET statement_timeout = '10s';

-- https://github.com/supabase/supabase/blob/master/docker/volumes/db/init/01-auth-schema.sql

CREATE SCHEMA IF NOT EXISTS "auth" AUTHORIZATION administrator;

CREATE TABLE auth.users (
  "id" uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  "email" text NOT NULL,
	"invitation_code" text DEFAULT NULL,
  "invited_at" timestamptz DEFAULT NULL,
	"verification_code" text DEFAULT NULL,
  "verified_at" timestamptz DEFAULT NULL,
  "recovery_code" text DEFAULT NULL,
  "recovered_at" timestamptz DEFAULT NULL,
	"password_key" text NOT NULL,
	"password_salt" text NOT NULL,
	"metadata" jsonb DEFAULT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE SQL STABLE
AS $$
	SELECT COALESCE(
		current_setting('request.jwt.claim.sub', true),
		(current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
	)::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE SQL STABLE
AS $$
	SELECT COALESCE(
		current_setting('request.jwt.claim.role', true),
		(current_setting('request.jwt.claims', true)::jsonb ->> 'role')
	)::text
$$;

CREATE OR REPLACE FUNCTION auth.email()
RETURNS text
LANGUAGE SQL STABLE
AS $$
	SELECT COALESCE(
		current_setting('request.jwt.claim.email', true),
		(current_setting('request.jwt.claims', true)::jsonb ->> 'email')
	)::text
$$;

GRANT USAGE ON SCHEMA auth TO anon, user_role, service_role;

CREATE USER auth_administrator NOINHERIT CREATEROLE LOGIN NOREPLICATION;

GRANT ALL PRIVILEGES ON SCHEMA auth TO auth_administrator;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO auth_administrator;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA auth TO auth_administrator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO auth_administrator;

ALTER USER auth_administrator SET search_path = "auth";

ALTER TABLE auth.users OWNER TO auth_administrator;
ALTER FUNCTION auth.uid OWNER TO auth_administrator;
ALTER FUNCTION auth.role OWNER TO auth_administrator;
ALTER FUNCTION auth.email OWNER TO auth_administrator;

GRANT EXECUTE ON FUNCTION auth.uid() TO PUBLIC;
GRANT EXECUTE ON FUNCTION auth.role() TO PUBLIC;
GRANT EXECUTE ON FUNCTION auth.email() TO PUBLIC;