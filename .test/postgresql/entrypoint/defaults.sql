-- initialize extensions
CREATE SCHEMA IF NOT EXISTS "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgaudit" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgsodium";

-- test uuid-ossp:
SELECT extensions.uuid_generate_v4();

-- test pgjwt:
SELECT extensions.sign('{"sub":"1234567890","name":"John Doe","admin":true}', 'secret', 'HS256');

-- test pgsodium:
SELECT * FROM pgsodium.crypto_box_new_keypair();

-- test pgsodium:
SELECT
	"password"::text,
    "salt"::text,
    pgsodium.crypto_pwhash("password", "salt")::text as "hash"
	FROM (
      SELECT
      	'password'::bytea as "password",
      	pgsodium.crypto_pwhash_saltgen() as "salt"
    )as table_one;

-- test pgsodium, expected hash: \x970d0e80120556642c641d67fea013ba3b8d249d041e92e1550220a6061dc457
SELECT
	"password"::text,
    "salt"::text,
    pgsodium.crypto_pwhash("password", "salt")::text as "hash"
	FROM (
      SELECT
      	'password'::bytea as "password",
      	'\x15708e9a39491dda0f3fd181cf09d886'::bytea as "salt"
    )as table_one;

-- test http:
SELECT (unnest(headers)).* FROM extensions.http_get('https://example.com/');

-- create authenticator role for postgrest
CREATE ROLE authenticator LOGIN NOINHERIT;

-- create anon role for postgrest
CREATE ROLE anon NOLOGIN NOINHERIT;
ALTER ROLE anon SET statement_timeout = '5s';
GRANT USAGE ON SCHEMA public TO anon; -- schema-level permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon; -- grant for table-level, rls for row-level permissions
GRANT anon TO authenticator;

-- create public.tasks table, http://0.0.0.0:5433/tasks
CREATE TABLE public.tasks (
	"id" uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
	"description" text NOT NULL
);
INSERT INTO public.tasks ("description") VALUES
	('Paint a self-portrait.'),
	('Build a house.');

-- Authentication: create private schema
CREATE SCHEMA private;

-- Authentication: create private.users table
CREATE TABLE private.users (
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
ALTER TABLE private.users ENABLE ROW LEVEL SECURITY;

-- Authentication: create public.users table
CREATE TABLE public.users (
  "id" uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  "email" text NOT NULL
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Authentication: create private.sub function
CREATE OR REPLACE FUNCTION private.sub()
RETURNS uuid
LANGUAGE SQL STABLE
AS $$
	SELECT COALESCE(
		current_setting('request.jwt.claim.sub', true),
		(current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
	)::uuid
$$;

-- Authentication: create private.role function
CREATE OR REPLACE FUNCTION private.role()
RETURNS text
LANGUAGE SQL STABLE
AS $$
	SELECT COALESCE(
		current_setting('request.jwt.claim.role', true),
		(current_setting('request.jwt.claims', true)::jsonb ->> 'role')
	)::text
$$;

-- Authentication: create private.email function
CREATE OR REPLACE FUNCTION private.email()
RETURNS text
LANGUAGE SQL STABLE
AS $$
	SELECT COALESCE(
		current_setting('request.jwt.claim.email', true),
		(current_setting('request.jwt.claims', true)::jsonb ->> 'email')
	)::text
$$;

-- Automatic Schema Cache Reloading: event function
-- https://postgrest.org/en/stable/schema_cache.html#schema-reloading
CREATE OR REPLACE FUNCTION public.pgrst_watch()
    RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NOTIFY pgrst, 'reload schema';
END;
$$;

-- Automatic Schema Cache Reloading: trigger function every ddl_command_end event
-- https://postgrest.org/en/stable/schema_cache.html#schema-reloading
CREATE EVENT TRIGGER pgrst_watch ON ddl_command_end EXECUTE PROCEDURE public.pgrst_watch();

-- http://localhost:5433/rpc/add_them?a=1&b=2
-- https://postgrest.org/en/stable/api.html#stored-procedures
CREATE FUNCTION add_them(a integer, b integer) RETURNS integer AS $$
    SELECT a + b;
$$ LANGUAGE SQL IMMUTABLE;