## Crestfall

## Usage

```sh
bash ./env.sh
sudo docker compose up --force-recreate --build
```

## Roadmap

### v1

#### Docker Containers

- [ ] PostgreSQL Server
- [ ] PostgREST Server
- [ ] TypeSense Server
- [ ] Authentication & Authorization Server
- [ ] Caddy Server

#### PostgreSQL Schema & Tables

- [ ] 00-extensions.sql
- [ ] 01-authentication.sql: private.users
- [ ] 02-authorization.sql: public.users, public.roles, public.permissions, public.assignments
- [ ] 03-settings.sql: private.settings, public.settings
- [ ] 04-app.sql: public.tasks

#### Logs

- [ ] PostgreSQL Logs
- [ ] PostgREST Logs
- [ ] TypeSense Logs
- [ ] Caddy Logs

### v2

#### Docker Containers

- [ ] 
