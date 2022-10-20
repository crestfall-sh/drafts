CREATE OR REPLACE FUNCTION http_post_to_typesense ()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
  declare
    document jsonb;
    response record;
begin
  IF TG_TABLE_SCHEMA = 'public' AND TG_TABLE_NAME = 'reports' THEN
    document = to_jsonb(new);
    response = http_post('http://localhost/collections/imegis-reports/documents?x-typesense-api-key=test', document::text, 'application/json');
    IF response.status != 201 THEN
      RAISE EXCEPTION 'EXCEPTION Unexpected HTTP Response: % %', response.status, response.content::text;
    END IF;
  END IF;
  IF TG_TABLE_SCHEMA = 'public' AND TG_TABLE_NAME = 'persons' THEN
    document = to_jsonb(new);
    IF document->>'birth_date' IS NOT NULL THEN
      document = jsonb_set(
        document,
        array['birth_date_human'],
        to_jsonb(to_char((document->>'birth_date')::timestamptz, 'Month DD, YYYY'))
      );
    END IF;
    response = http_post('http://localhost/collections/imegis-persons/documents?x-typesense-api-key=test', document::text, 'application/json');
    IF response.status != 201 THEN
      RAISE EXCEPTION 'EXCEPTION Unexpected HTTP Response: % %', response.status, response.content::text;
    END IF;
  END IF;
  return new;
end;
$$;

DO LANGUAGE plpgsql $$
  declare
    table_name text;
    table_names text[] = array['reports']::text[];
    drop_trigger text = 'DROP TRIGGER IF EXISTS before_insert_update ON %I.%I CASCADE;';
    create_trigger text = 'CREATE TRIGGER before_insert_update BEFORE INSERT OR UPDATE ON %I.%I FOR EACH ROW EXECUTE PROCEDURE http_post_to_typesense();';
  begin
    FOREACH table_name IN ARRAY table_names
    loop
      EXECUTE format(drop_trigger, 'public', table_name);
      EXECUTE format(create_trigger, 'public', table_name);
    end loop;
  end;
$$;

DO LANGUAGE plpgsql $$
  begin
    CALL track('public', 'reports');
  end;
$$;

