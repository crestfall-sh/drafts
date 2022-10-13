
CREATE SCHEMA IF NOT EXISTS "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";
SELECT (unnest(headers)).* FROM extensions.http_get('https://example.com/');

CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "extensions";
-- optionally, grant usage to regular users:
-- GRANT USAGE ON SCHEMA cron TO marco;

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
SELECT extensions.sign('{"sub":"1234567890","name":"John Doe","admin":true}', 'secret', 'HS384');

CREATE EXTENSION IF NOT EXISTS "pgsodium";
SELECT * FROM pgsodium.crypto_box_new_keypair();

CREATE EXTENSION IF NOT EXISTS "pgaudit";