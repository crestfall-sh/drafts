
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;

CREATE TABLE public.users (
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "name" text NOT NULL
);

CREATE TABLE public.roles (
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "name" text NOT NULL
);

CREATE TABLE public.permissions (
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "role_id" uuid REFERENCES public.roles NOT NULL,
  "resource" text NOT NULL, -- crestfall:authorization
  "actions" text[] NOT NULL -- read, write
);

CREATE TABLE public.assignments (
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "user_id" uuid REFERENCES public.users NOT NULL,
  "role_id" uuid REFERENCES public.roles NOT NULL,
  "assigned_by_user_id" uuid REFERENCES public.users DEFAULT NULL,
  "assigned_at" timestamptz DEFAULT now()
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_authorized (
  param_user_id uuid,
  param_resource text,
  param_action text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result boolean;
BEGIN
  SELECT 1 INTO result FROM public.assignments
  WHERE public.assignments.user_id = param_user_id
  AND EXISTS (
      SELECT 1 FROM public.permissions
      WHERE public.permissions.role_id = public.assignments.role_id
      AND param_resource = public.permissions.resource
      AND param_action = ANY(public.permissions.actions)
  );
  result = COALESCE(result, false);
  return result;
END;
$$;

INSERT INTO public.users ("id", "name")
VALUES
  ('00000000-0000-0000-0000-000000000000', 'alice'),
  ('00000000-0000-0000-0000-000000000001', 'bob');

INSERT INTO public.roles ("name")
VALUES ('administrator'), ('moderator');

INSERT INTO public.permissions ("role_id", "resource", "actions")
VALUES (
  (SELECT "id" FROM public.roles WHERE "name" = 'administrator'),
  'crestfall:authentication',
  ARRAY['read', 'write']::text[]
);

INSERT INTO public.assignments ("user_id", "role_id")
VALUES (
  (SELECT "id" FROM public.users WHERE "name" = 'alice'),
  (SELECT "id" FROM public.roles WHERE "name" = 'administrator')
);
INSERT INTO public.assignments ("user_id", "role_id")
VALUES (
  (SELECT "id" FROM public.users WHERE "name" = 'alice'),
  (SELECT "id" FROM public.roles WHERE "name" = 'moderator')
);

SELECT * FROM public.users;

SELECT
  "name",
  is_authorized("id", 'crestfall:authentication', 'read') as authentication
FROM public.users;

SELECT
  "name",
  is_authorized("id", 'crestfall:authorization', 'read') as authorization
FROM public.users;

SELECT * FROM (SELECT * FROM "assignments" WHERE "user_id" = '00000000-0000-0000-0000-000000000000') as assignments
LEFT OUTER JOIN (SELECT * FROM "roles") as role
ON assignments."id" = role."id";

SELECT uuid_generate_v4();

CREATE OR REPLACE FUNCTION asd (
  param_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  data jsonb;
  result boolean;
BEGIN
  SELECT jsonb_agg(assignments) FROM assignments WHERE "user_id" = param_user_id INTO data;
  RAISE INFO 'data: %', data::text;
  -- SELECT * FROM "roles" WHERE "id" = param_user_id;
  -- x*yz = to_jsonb();
  return true;
END;
$$;

SELECT asd('00000000-0000-0000-0000-000000000000');

-- https://www.postgresql.org/docs/14/functions-json.html
-- https://www.postgresql.org/docs/14/functions-aggregate.html
-- https://www.postgresql.org/docs/14/plpgsql-errors-and-messages.html