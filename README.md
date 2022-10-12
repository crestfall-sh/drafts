## Crestfall

### Overview

Crestfall is an open-source alternative for some parts of Supabase and Firebase.

We use PostgreSQL, PostgREST, TypeSense, uWebSockets.js, Caddy

- PostgreSQL for our relational database
- PostgREST for our REST API (in progress)
- TypeSense for our Search API (planned)
- uWebSockets.js for our Realtime API (planned)
- SeaweedFS for our S3 Storage API (planned)
- Caddy for automated TLS and internal routing (planned)

### Project Structure

- Crestfall Auth - our authentication and authorization server, provides our sign-up, sign-in, sign-out api's.
- Crestfall Studio - our instance administration web app, lets you execute your sql scripts.
- Crestfall Search - TODO
- Crestfall Realtime - TODO
- Crestfall Storage - TODO

### Usage

```sh
cd ./crestfall-docker/
sudo rm -rf ./volumes/
sudo docker compose build --progress=plain
sudo docker compose build --progress=plain --no-cache
sudo docker compose up
sudo docker compose down
```

### License

MIT