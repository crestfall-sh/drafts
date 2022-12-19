
-- Usage Instructions
-- - Go to Supabase SQL Editor
-- - Invite joshxyzhimself@gmail.com in users
-- - Run 1-audit.sql
-- - Run 2-rbac.sql (requires audit.sql)
-- - Run 3-imegis.sql (requires audit.sql)

-- TODO
-- [x] show jsonb on insert, update, delete
-- [x] show jsonb diff on updates
-- [x] show user_id
-- [x] log public.* events using trigger
-- [x] log auth.sessions events using trigger
-- [x] create procedures callable in other sql files
-- [x] add example usage for tracking and untracking tables

-- References
-- https://www.pgaudit.org/
-- https://github.com/pgaudit/pgaudit
-- https://supabase.com/blog/audit
-- https://github.com/supabase/supa_audit
-- https://news.ycombinator.com/item?id=30615470
-- https://github.com/2ndQuadrant/audit-trigger
-- https://github.com/cmabastar/audit-trigger
-- https://wiki.postgresql.org/wiki/Audit_trigger_91plus
-- https://www.postgresql.org/docs/current/plpgsql-trigger.html
-- https://coussej.github.io/2016/05/24/A-Minus-Operator-For-PostgreSQLs-JSONB/
-- https://github.com/supabase/supabase/discussions/8771

DROP TYPE IF EXISTS "operation" CASCADE;
DROP TABLE IF EXISTS "logs" CASCADE;
DROP INDEX IF EXISTS "logs_oid" CASCADE;
DROP INDEX IF EXISTS "logs_ts" CASCADE;

CREATE TYPE "operation" AS ENUM ('INSERT', 'UPDATE', 'DELETE');

CREATE TABLE "logs" (
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "table_oid" oid NOT NULL,
  "table_schema" text NOT NULL,
  "table_name" text NOT NULL,
  "table_operation" operation NOT NULL,
  "row_id" uuid NOT NULL,
  "row_data" jsonb NOT NULL,
  "user_id" uuid REFERENCES auth.users DEFAULT auth.uid(),
  "timestamp" timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE "logs" ENABLE ROW LEVEL SECURITY;

CREATE INDEX "logs_oid" ON "logs" USING BTREE("table_oid");

CREATE INDEX "logs_ts" ON "logs" USING BRIN("timestamp");

CREATE OR REPLACE FUNCTION jsonb_diff(arg1 jsonb,arg2 jsonb)
RETURNS jsonb LANGUAGE sql
AS $$
SELECT 
	COALESCE(json_object_agg(key,
    CASE WHEN jsonb_typeof(value) = 'object' AND arg2 -> key IS NOT NULL 
			THEN jsonb_diff(value, arg2 -> key)
      ELSE value
    END
  ), '{}')::jsonb
FROM jsonb_each(arg1)
WHERE arg1 -> key <> arg2 -> key OR arg2 -> key IS NULL
$$;

CREATE OR REPLACE FUNCTION insert_log ()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
  declare
    row_data jsonb;
  begin
    IF new IS NOT NULL AND old IS NOT NULL THEN
      row_data = public.jsonb_diff(to_jsonb(new), to_jsonb(old));
    ELSE
      row_data = to_jsonb(COALESCE(new, old));
    END IF;
    IF TG_TABLE_SCHEMA = 'auth' AND TG_TABLE_NAME = 'sessions' THEN
      INSERT INTO public.logs ("table_oid", "table_schema", "table_name", "table_operation", "row_id", "row_data", "user_id")
      SELECT TG_RELID, TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP::public.operation, COALESCE(new.id, old.id), row_data, (row_data->>'user_id')::uuid;
    ELSE
      INSERT INTO public.logs ("table_oid", "table_schema", "table_name", "table_operation", "row_id", "row_data")
      SELECT TG_RELID, TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP::public.operation, COALESCE(new.id, old.id), row_data;
    END IF;
    return COALESCE(new, old);
  end;
$$;

CREATE OR REPLACE PROCEDURE untrack (table_schema text, table_name text)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
  declare
    drop_trigger text = 'DROP TRIGGER IF EXISTS after_insert_update_delete ON %I.%I CASCADE;';
  begin 
    EXECUTE format(drop_trigger, table_schema, table_name);
  end;
$$;

CREATE OR REPLACE PROCEDURE track (table_schema text, table_name text)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
  declare
    create_trigger text = 'CREATE TRIGGER after_insert_update_delete AFTER INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE PROCEDURE insert_log();';
  begin
    CALL untrack(table_schema, table_name);
    EXECUTE format(create_trigger, table_schema, table_name);
  end;
$$;

CREATE OR REPLACE PROCEDURE untrack_public ()
LANGUAGE plpgsql SECURITY DEFINER
AS $$
  declare
    table_record record;
  begin
    for table_record in
      SELECT * FROM information_schema.tables
      WHERE "table_schema" = 'public' AND "table_type" = 'BASE TABLE' AND "table_name" != 'logs'
    loop
      CALL untrack(table_record.table_schema, table_record.table_name);
    end loop;
  end;
$$;

CREATE OR REPLACE PROCEDURE track_public ()
LANGUAGE plpgsql SECURITY DEFINER
AS $$
  declare
    table_record record;
  begin
    for table_record in
      SELECT * FROM information_schema.tables
      WHERE "table_schema" = 'public' AND "table_type" = 'BASE TABLE' AND "table_name" != 'logs'
    loop
      CALL track(table_record.table_schema, table_record.table_name);
    end loop;
  end;
$$;

-- example usage:
-- CALL track('public', 'tasks');
-- track all public tables:
-- CALL untrack_public();
-- track auth.sessions:
-- CALL track('auth', 'sessions');

DO LANGUAGE plpgsql $$
  begin
    CALL track('auth', 'sessions');
  end;
$$;