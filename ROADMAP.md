## Roadmap

### Completed

- PostgreSQL service at 0.0.0.0:5432
  - extension pgcrypto
  - extension uuid-ossp
  - extension http (pgsql-http)
  - extension pg_cron
  - extension pgjwt
  - extension pgsodium
  - script: extensions
  - script: authentication
    - https://github.com/supabase/supabase/blob/master/docker/volumes/db/init/00-initial-schema.sql
    - https://github.com/supabase/supabase/blob/master/docker/volumes/db/init/01-auth-schema.sql
- PostgREST service at 0.0.0.0:5433
- TypeSense service at 0.0.0.0:8018

### In Progress

- PostgreSQL
  - script: authorization
  - extension: pgaudit
  - script: audit
- crestfall-auth-server
  - https://github.com/supabase/gotrue
  - https://github.com/netlify/gotrue
  - https://www.authelia.com/

### Planned

- use environment variables
  - https://docs.docker.com/compose/environment-variables/
  - https://github.com/supabase/supabase/blob/master/docker/docker-compose.yml
- integrate crestfall_authentication: auth.uid()
- integrate crestfall_authorization: is_authorized()
- integrate crestfall_audit: track()
- server-side rest api
- client-side authentication with fetch api
- client-side query with fetch api
- typesense data sync
- static file server
- functions server
- crestfall studio
  - postgresql tables
    - table editor
    - query editor
    - typesense collections
  - authentication
    - users
    - sessions
  - authorization
  - functions
  - cron jobs
  - storage
  - logs
  - backup
  - recovery
- functions
  - how to load moduiles

### Under Review

- integrate supabase graphql
- integrate pgbouncer
- integrate pgaudit
- postgresql-redis extension
  - postgresql trigger + redis pub/sub
  - learn c: https://beej.us/guide/bgc/
  - learn network programming: https://beej.us/guide/bgnet/
  - learn extensions: https://www.postgresql.org/docs/current/extend.html
  - integrate redis: https://github.com/redis/hiredis

### Caddy (Under Review)

- docker: https://hub.docker.com/_/caddy
- wildcard: https://caddyserver.com/docs/automatic-https#wildcard-certificates