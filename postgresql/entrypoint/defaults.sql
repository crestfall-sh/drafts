-- extensions
CREATE SCHEMA IF NOT EXISTS "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- http://0.0.0.0:5433/tasks
CREATE TABLE public.tasks (
	"id" uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
	"description" text NOT NULL
);
INSERT INTO public.tasks ("description") VALUES
	('Paint a self-portrait.'),
	('Build a house.');

CREATE ROLE anon NOLOGIN NOINHERIT;
GRANT USAGE ON SCHEMA public TO anon; -- schema-level permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon; -- table-level permissions; grant for table, rls for rows
ALTER ROLE anon SET statement_timeout = '5s';

CREATE ROLE authenticator LOGIN NOINHERIT;
GRANT anon TO authenticator;







-- https://github.com/supabase/supabase/blob/master/docker/volumes/db/init/00-initial-schema.sql

/*

- "authenticator" user:
  - can ONLY access "public" schema
  - default role when connecting to the database
	- can switch to roles: "anon", "public_user", "public_service"

- "public_admin" user:
  - can ONLY access "public" schema
  - can create tables

- "auth_admin" user:
  - can ONLY access "auth" schema

*/

CREATE ROLE anon NOLOGIN NOINHERIT;
CREATE ROLE public_user NOLOGIN NOINHERIT;
CREATE ROLE public_service NO		LOGIN NOINHERIT BYPASSRLS;

CREATE ROLE public_admin LOGIN SUPERUSER CREATEDB CREATEROLE REPLICATION BYPASSRLS;
ALTER ROLE public_admin SET search_path TO public, extensions;

CREATE ROLE authenticator LOGIN NOINHERIT;
GRANT anon TO authenticator;
GRANT public_user TO authenticator;
GRANT public_service TO authenticator;
GRANT public_admin TO authenticator;

GRANT USAGE ON SCHEMA public TO postgres, anon, public_user, public_service;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, public_user, public_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, public_user, public_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, public_user, public_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, public_user, public_service;
ALTER DEFAULT PRIVILEGES FOR ROLE public_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, public_user, public_service;
ALTER DEFAULT PRIVILEGES FOR ROLE public_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, public_user, public_service;
ALTER DEFAULT PRIVILEGES FOR ROLE public_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, public_user, public_service;

ALTER ROLE anon SET statement_timeout = '5s';
ALTER ROLE public_user SET statement_timeout = '10s';

-- https://github.com/supabase/supabase/blob/master/docker/volumes/db/init/01-auth-schema.sql

CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION public_admin;

CREATE TABLE auth.users (
  "id" uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  "email" text NOT NULL,
	"invitation_code" text DEFAULT NULL,
  "invited_at" timestamptz DEFAULT NULL,
	"verification_code" text DEFAULT NULL,
  "verified_at" timestamptz DEFAULT NULL,
  "recovery_code" text DEFAULT NULL,
  "recovered_at" timestamptz DEFAULT NULL,
	"password_salt" text NOT NULL,
	"password_key" text NOT NULL,
	"metadata" jsonb DEFAULT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
	UNIQUE("email")
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

CREATE ROLE auth_admin NOINHERIT CREATEROLE LOGIN;
ALTER ROLE auth_admin SET search_path TO auth;

GRANT ALL PRIVILEGES ON SCHEMA auth TO auth_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO auth_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA auth TO auth_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO auth_admin;

ALTER TABLE auth.users OWNER TO auth_admin;
ALTER FUNCTION auth.uid OWNER TO auth_admin;
ALTER FUNCTION auth.role OWNER TO auth_admin;
ALTER FUNCTION auth.email OWNER TO auth_admin;

GRANT EXECUTE ON FUNCTION auth.uid() TO public;
GRANT EXECUTE ON FUNCTION auth.role() TO public;
GRANT EXECUTE ON FUNCTION auth.email() TO public;

GRANT USAGE ON SCHEMA auth TO anon, public_user, public_service;

-- INSERT user admin@crestfall.sh
-- admin@crestfall.sh : test1234
INSERT INTO auth.users ("email", "password_salt", "password_key")
VALUES (
	'admin@crestfall.sh',
	'59b4e56da3cb71fbb6ca883b41ae415005367c1c598fba3cc0c0a360ad5b6868',
	'2e866eac82cc13ed55e849d45c99f083dd75da7664882620ec66a0376f13f16ff723443d129232fe5c55ea58d7a62169557e66662cac9fe0d4ca1c6586a469f5'
);
