
-- TABLE public.settings
DROP TABLE IF EXISTS public.settings CASCADE;
CREATE TABLE public.settings (
  "id" serial,
  "key" text NOT NULL,
  "value" text NOT NULL,
  UNIQUE("key")
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- POLICY for public.settings SELECT
DROP POLICY IF EXISTS settings_select ON public.settings;
CREATE POLICY settings_select ON public.settings AS PERMISSIVE
FOR SELECT TO public_user USING (
  is_authorized(auth.uid(), 'settings:read') = true
);

-- POLICY for public.settings INSERT
DROP POLICY IF EXISTS settings_insert ON public.settings;
CREATE POLICY settings_insert ON public.settings AS PERMISSIVE
FOR INSERT TO public_user WITH CHECK (
  is_authorized(auth.uid(), 'settings:write') = true
);

-- POLICY for public.settings DELETE
DROP POLICY IF EXISTS settings_delete ON public.settings;
CREATE POLICY settings_delete ON public.settings AS PERMISSIVE
FOR DELETE TO public_user USING (
  is_authorized(auth.uid(), 'settings:write') = true
);

-- INSERT default public.settings
INSERT INTO public.settings ("key", "value")
VALUES
  ('smtp.server','smtp.sendgrid.net'),
  ('smtp.port','587'),
  ('smtp.username', 'apikey'),
  ('smtp.password', 'YOUR_SENDGRID_API_KEY');