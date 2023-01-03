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
