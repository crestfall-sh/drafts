
-- Note: Read 1-audit.sql for usage instructions.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TYPE IF EXISTS "role" CASCADE;
DROP TYPE IF EXISTS "scope" CASCADE;
DROP TYPE IF EXISTS "action" CASCADE;

DROP TABLE IF EXISTS "roles" CASCADE;
DROP TABLE IF EXISTS "permissions" CASCADE;
DROP TABLE IF EXISTS "user_roles" CASCADE;
DROP TABLE IF EXISTS "profiles" CASCADE;

DROP TRIGGER IF EXISTS on_auth_users_insert ON auth.users CASCADE;

-- You may create roles here, e.g. supervisor, operator, staff.
CREATE TYPE "role" AS ENUM ('administrator', 'moderator');

-- You may create scopes here, e.g. table names.
CREATE TYPE "scope" AS ENUM ('authentication', 'authorization', 'logs');

-- You may create actions here, e.g. create, read, update, delete
CREATE TYPE "action" AS ENUM ('read', 'write');

CREATE TABLE "profiles" (
  "id" uuid REFERENCES auth.users PRIMARY KEY,
  "email" text NOT NULL
);
CREATE TABLE "roles" (
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "name" role NOT NULL
);
CREATE TABLE "permissions" (
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "role_id" uuid REFERENCES "roles" ON DELETE CASCADE NOT NULL,
  "scope" scope NOT NULL,
  "actions" action[] NOT NULL
);
CREATE TABLE "user_roles" (
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "user_id" uuid REFERENCES "profiles" ON DELETE CASCADE NOT NULL,
  "role_id" uuid REFERENCES "roles" ON DELETE CASCADE NOT NULL
);

ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_authorized (
  param_user_id uuid,
  param_permission_scope scope,
  param_permission_action action
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
AS $$
declare
  result boolean;
begin
  SELECT 1 INTO result FROM user_roles
  WHERE user_roles.user_id = param_user_id
  AND EXISTS (
      SELECT 1 FROM permissions
      WHERE permissions.role_id = user_roles.role_id
      AND param_permission_scope = permissions.scope
      AND param_permission_action = ANY(permissions.actions)
  );
  result = COALESCE(result, false);
  return result;
end;
$$;

CREATE OR REPLACE FUNCTION insert_profile ()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
begin
  INSERT INTO public.profiles ("id", "email")
  VALUES (new.id, new.email);
  return new;
end;
$$;

CREATE TRIGGER after_insert
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE insert_profile();

INSERT INTO profiles
SELECT "id", "email" FROM auth.users;

-- [x] profiles SELECT
CREATE POLICY "profiles:select" ON "profiles" AS PERMISSIVE
FOR SELECT TO authenticated USING (
  is_authorized(auth.uid(), 'authentication', 'read') = true
);

-- [x] roles SELECT
CREATE POLICY "roles-select" ON "roles" AS PERMISSIVE
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.role_id = roles.id
    AND user_roles.user_id = auth.uid()
  )
  OR is_authorized(auth.uid(), 'authentication', 'read') = true
);

-- [x] permissions SELECT
CREATE POLICY "permissions-select" ON "permissions" AS PERMISSIVE
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = permissions.role_id
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.role_id = roles.id
      AND user_roles.user_id = auth.uid()
    )
  )
  OR is_authorized(auth.uid(), 'authentication', 'read') = true
);

-- [x] user_roles SELECT
CREATE POLICY "user_roles-select" ON "user_roles" AS PERMISSIVE
FOR SELECT TO authenticated USING (
  user_roles.user_id = auth.uid()
  OR is_authorized(auth.uid(), 'authentication', 'read') = true
);

-- [x] user_roles INSERT
CREATE POLICY "user_roles-insert" ON "user_roles" AS PERMISSIVE
FOR INSERT TO authenticated WITH CHECK (
  is_authorized(auth.uid(), 'authorization', 'write') = true
);

-- [x] user_roles DELETE
CREATE POLICY "user_roles-delete" ON "user_roles" AS PERMISSIVE
FOR DELETE TO authenticated USING (
  is_authorized(auth.uid(), 'authorization', 'write') = true
);

-- [x] administrator role
INSERT INTO "roles" ("name")
VALUES ('administrator');

-- [x] moderator role
INSERT INTO "roles" ("name")
VALUES ('moderator');

-- [x] administrator permissions
INSERT INTO "permissions" ("role_id", "scope", "actions")
VALUES (
  (SELECT "id" FROM "roles" WHERE "name" = 'administrator'),
  'authentication',
  ARRAY['read', 'write']::action[]
);
INSERT INTO "permissions" ("role_id", "scope", "actions")
VALUES (
  (SELECT "id" FROM "roles" WHERE "name" = 'administrator'),
  'authorization',
  ARRAY['read', 'write']::action[]
);
INSERT INTO "permissions" ("role_id", "scope", "actions")
VALUES (
  (SELECT "id" FROM "roles" WHERE "name" = 'administrator'),
  'logs',
  ARRAY['read']::action[]
);

-- [x] moderator permissions
INSERT INTO "permissions" ("role_id", "scope", "actions")
VALUES (
  (SELECT "id" FROM "roles" WHERE "name" = 'moderator'),
  'authentication',
  ARRAY['read']::action[]
);
INSERT INTO "permissions" ("role_id", "scope", "actions")
VALUES (
  (SELECT "id" FROM "roles" WHERE "name" = 'moderator'),
  'authorization',
  ARRAY['read']::action[]
);

INSERT INTO "user_roles" ("user_id", "role_id")
VALUES (
  (SELECT "id" FROM "users" WHERE "email" = 'joshxyzhimself@gmail.com'),
  (SELECT "id" FROM "roles" WHERE "name" = 'administrator')
);

CREATE POLICY "logs-select" ON "logs" AS PERMISSIVE
FOR SELECT TO authenticated USING (
  is_authorized(auth.uid(), 'logs', 'read') = true
);

DO LANGUAGE plpgsql $$
  begin
    CALL track('public', 'roles');
    CALL track('public', 'permissions');
    CALL track('public', 'user_roles');
    CALL track('public', 'profiles');
  end;
$$;