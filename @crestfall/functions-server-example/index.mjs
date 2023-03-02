// @ts-check

import fs from 'fs';
import url from 'url';
import path from 'path';
import assert from 'assert';
import * as server from './server/index.mjs';
import on_exit from './server/on_exit.mjs';
import env from './server/env.mjs';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(env);

const app = server.uws.App({});

const functions_path = path.join(__dirname, '/functions/');
assert(fs.existsSync(functions_path) === true);

const pathnames = fs.readdirSync(functions_path);

for (let i = 0, l = pathnames.length; i < l; i += 1) {

  const pathname = pathnames[i];

  const function_path = path.join(functions_path, pathname);
  assert(fs.existsSync(function_path) === true);

  const function_entry_path = path.join(function_path, 'index.mjs');
  assert(fs.existsSync(function_entry_path) === true);

  console.log(`Crestfall Functions: Function "${pathname}" importing..`);
  const fn = await import(function_entry_path);
  assert(fn.bind instanceof Function);
  fn.bind(app, server);

  console.log(`Crestfall Functions: Function "${pathname}" OK.`);

}

const port = typeof process.env['CRESTFALL_FUNCTION_PORT'] === 'string' ? Number(process.env['CRESTFALL_FUNCTION_PORT']) : 8080;

console.log(`Crestfall Functions: Listening at port ${port}..`);
const token = await server.http(app, server.port_access_types.EXCLUSIVE, port);

console.log('Crestfall Functions: Listen OK.');

on_exit(() => {

  console.log('Crestfall Functions: Closing sockets..');
  server.uws.us_listen_socket_close(token);

  console.log('Crestfall Functions: Close sockets OK.');

});