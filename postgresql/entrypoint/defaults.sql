CREATE SCHEMA IF NOT EXISTS "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- http://0.0.0.0:5433/tasks
CREATE TABLE public.tasks ("id" uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY, "description" text NOT NULL);
INSERT INTO public.tasks ("description") VALUES ('Paint a self-portrait.'), ('Build a house.');

CREATE ROLE anon NOLOGIN NOINHERIT;
GRANT USAGE ON SCHEMA public TO anon; -- schema-level permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon; -- table-level permissions; grant for table, rls for rows
ALTER ROLE anon SET statement_timeout = '5s';

CREATE ROLE authenticator LOGIN NOINHERIT;
GRANT anon TO authenticator;