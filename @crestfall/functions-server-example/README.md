# Functions Server

## Roadmap

#### Completed

- Serving of functions from /functions/ folder.
- Creating of Environment Variables in Local Host.
- Loading of Environment Variables in Local Host.
- Loading of Environment Variables in Docker Container.

#### Planned / In Progress

- WebSocket hooks for on_connect, on_message, on_disconnect events.

#### Under Review

- Can each function be a separate process?
- Can each function use a separate port?
- Can each end-user use a shared cache (like Redis)?
- Can each end-user communicate with websockets?
- Can we support an npx command `npx @crestfall/functions ./` where it only has .env file and functions?
- Each individual function only needs:
  - .env file
  - HTTP Server (express.js, fastify.js, uwebsockets.js; let them use any)
  - Usage of port from `process.env['PORT']`
- We can serve these functions by:
  - Locally thru Node.js
  - Locally thru Dockerized Node.js
  - Remotely thru Functions Manager (needs an access token, just send the function id and function tarball)
  - Remotely thru GitHub and Functions Manager (functions manager should listen to repository updates)

## Usage

#### Creating Environment Variables (.env file)

```sh
bash ./env.sh
```

#### Running with Node.js in Local Host

```sh
npm install
node ./index.mjs
```

#### Running with Node.js in Docker Container

```sh
sudo docker compose up --force-recreate --build
```

#### License

MIT