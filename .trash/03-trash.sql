
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
  item record;
  items record;
  result boolean;
BEGIN
  SELECT jsonb_agg(assignments) FROM assignments WHERE "user_id" = param_user_id INTO items;
  RAISE INFO 'item: %',  jsonb_array_length(items)::text;

  FOR item IN (SELECT jsonb_array_elements(items))
  LOOP
    RAISE INFO 'item: %', item::text;
  END LOOP;

  -- SELECT * FROM "roles" WHERE "id" = param_user_id;
  -- x*yz = to_jsonb();
  RETURN true;
END;
$$;

SELECT asd('00000000-0000-0000-0000-000000000000');

SELECT assignments.*, to_jsonb(_user) as _user, to_jsonb(_role) as _role
FROM assignments
LEFT OUTER JOIN (SELECT * FROM users) as _user
ON assignments.user_id = _user.id
LEFT OUTER JOIN (
  SELECT roles.*, to_jsonb(array_agg(_permissions)) as _permissions
  FROM roles
  LEFT OUTER JOIN (SELECT * FROM permissions) as _permissions
  ON roles.id = _permissions.role_id
  GROUP BY roles.id
) as _role
ON assignments.role_id = _role.id;

--                  id                  |               user_id                |               role_id                | assigned_by_user_id |          assigned_at          |                              _user                              |                                                                                                                                                                                                                   _role                                                                                                                                                                                                                    
--------------------------------------+--------------------------------------+--------------------------------------+---------------------+-------------------------------+-----------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
-- 254f3cd7-67ff-41d4-b556-8d775ccdf218 | 00000000-0000-0000-0000-000000000000 | c01d67ac-07f6-459c-87f4-dc4942e665a6 |                     | 2022-10-19 07:26:15.369815+00 | {"id": "00000000-0000-0000-0000-000000000000", "name": "alice"} | {"id": "c01d67ac-07f6-459c-87f4-dc4942e665a6", "name": "administrator", "_permissions": [{"id": "204b9dfc-8201-4e1d-b712-359ef3801e5a", "actions": ["read", "write"], "role_id": "c01d67ac-07f6-459c-87f4-dc4942e665a6", "resource": "crestfall:authentication"}, {"id": "a397c437-368f-4668-889c-145809dcd891", "actions": ["read", "write"], "role_id": "c01d67ac-07f6-459c-87f4-dc4942e665a6", "resource": "crestfall:authorization"}]}
-- 5b66a9be-8d86-49cd-af90-4faa07e6bca2 | 00000000-0000-0000-0000-000000000000 | 62a4b4d9-15d1-4b44-ac9a-13963f4c4480 |                     | 2022-10-19 07:26:15.371225+00 | {"id": "00000000-0000-0000-0000-000000000000", "name": "alice"} | {"id": "62a4b4d9-15d1-4b44-ac9a-13963f4c4480", "name": "moderator", "_permissions": [{"id": "1aba0130-876a-44fe-9439-c75e1d010f74", "actions": ["read"], "role_id": "62a4b4d9-15d1-4b44-ac9a-13963f4c4480", "resource": "crestfall:authorization"}]}
-- (2 rows)


SELECT assignments.*, to_jsonb(role) as role
FROM assignments
LEFT OUTER JOIN (
  SELECT roles.*, to_jsonb(array_agg(permissions)) as permissions
  FROM roles
  LEFT OUTER JOIN (SELECT * FROM permissions) as permissions
  ON roles.id = permissions.role_id
  GROUP BY roles.id
) as role
ON assignments.role_id = role.id;


--                  id                  |               user_id                |               role_id                | assigned_by_user_id |          assigned_at          |                                                                                                                                                                                                                   role                                                                                                                                                                                                                    
--------------------------------------+--------------------------------------+--------------------------------------+---------------------+-------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
-- 1bed289c-9155-49be-b636-b271200723fc | 00000000-0000-0000-0000-000000000000 | 49c85a06-75b1-4eb8-901a-5eb7de32628b |                     | 2022-10-19 07:28:25.84665+00  | {"id": "49c85a06-75b1-4eb8-901a-5eb7de32628b", "name": "administrator", "permissions": [{"id": "e4734907-9dec-4e39-a9a0-492e00c00015", "actions": ["read", "write"], "role_id": "49c85a06-75b1-4eb8-901a-5eb7de32628b", "resource": "crestfall:authentication"}, {"id": "2526b131-e10b-4e72-8486-222d0ebc9c2f", "actions": ["read", "write"], "role_id": "49c85a06-75b1-4eb8-901a-5eb7de32628b", "resource": "crestfall:authorization"}]}
-- 11f2ccfb-2ed2-40ec-bcd9-a36e33c1e4fb | 00000000-0000-0000-0000-000000000000 | 881c5832-94a0-4a44-aba4-49d689fe8880 |                     | 2022-10-19 07:28:25.847981+00 | {"id": "881c5832-94a0-4a44-aba4-49d689fe8880", "name": "moderator", "permissions": [{"id": "e8170ed7-b096-42a4-bf80-5db8aba9b7fb", "actions": ["read"], "role_id": "881c5832-94a0-4a44-aba4-49d689fe8880", "resource": "crestfall:authorization"}]}
-- (2 rows)
