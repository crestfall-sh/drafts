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

#### Environment Variables

- https://docs.docker.com/compose/environment-variables/
- https://github.com/supabase/supabase/blob/master/docker/docker-compose.yml

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

- integrate crestfall_authentication: auth.uid()
- integrate crestfall_authorization: is_authorized()
- integrate crestfall_audit: track()
- server-side rest api
- client-side authentication with fetch api
- client-side query with fetch api
- typesense data sync
- static file server
- functions
  - how to load moduiles

#### Crestfall Studio

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

### Under Review

- integrate supabase graphql
- integrate pgbouncer
- integrate pgaudit

#### Crestfall Web Server

- serve web pages
- serve static files
- serve functions

#### Crestfall Functions

- build step: pull codes
- build step: apply env
- build step: install modules
- build step: bind routes
- local development environment
- remote staging environment
- remote production environment
- access to built-in secrets
- access to custom secrets (from env)
- access to built-in s3 storage
- access to built-in redis cache

#### PostgreSQL Redis Extension

- postgresql trigger + redis pub/sub
- learn c: https://beej.us/guide/bgc/
- learn network programming: https://beej.us/guide/bgnet/
- learn extensions: https://www.postgresql.org/docs/current/extend.html
- integrate redis: https://github.com/redis/hiredis

#### Caddy

- docker: https://hub.docker.com/_/caddy
- wildcard: https://caddyserver.com/docs/automatic-https#wildcard-certificates
- studio.example.com for crestfall studio
- typesense.example.com for typesense server
- pgbouncer.example.com for postgresql server

#### PGBouncer

- first, as our connection manager
- second, as our tls handler
- https://www.pgbouncer.org/config.html#tls-settings

```
pgbouncer would fit the bill here, including separate configuration for client and server SSL. So you could even use SSL termination to pgbouncer, but go without for the connection between pgbouncer and the Postgres cluster itself.

https://www.reddit.com/r/PostgreSQL/comments/p2dsu0/comment/h8jca7j/?utm_source=reddit&utm_medium=web2x&context=3
```

#### Envoy (discarded)

- can use certbot for creating certificates
- can use envoy for postgresql tls
- still not stable though
- https://www.envoyproxy.io/docs/envoy/latest/api-v3/extensions/filters/network/postgres_proxy/v3alpha/postgres_proxy.proto.html
- https://www.envoyproxy.io/docs/envoy/latest/configuration/listeners/network_filters/postgres_proxy_filter#config-network-filters-postgres-proxy

#### Pricing

```
(supabase ceo)
EBS pricing is here: https://aws.amazon.com/ebs/pricing/

I'd have to check with the team but I'm 80% sure we're on gp3 ($0.08/GB-month).

That said, we have a very generous free tier. With AWS we have an enterprise plan + savings plan + reserved instances. Not all of these affect EBS pricing, but we end up paying a lot less than the average AWS user due to our high-usage.

https://news.ycombinator.com/item?id=32987502
```