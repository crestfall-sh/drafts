// @ts-check

/**
 * @typedef {import('./index').user} user
 */

import fs from 'fs';
import path from 'path';
import readline from 'node:readline/promises';
import * as uwu from 'modules/uwu.mjs';
import * as mime_types from 'mime-types';
import env from '../../env.mjs';

console.log(env);

/**
 * What's in here:
 * - Internal authentication client, in your command line interface
 * - Enter the commands in your console to test them!
 * - /ct - creates an anon token
 * - /su - creates an anon token, signs-up a new user
 */
process.nextTick(async () => {
  const rli = readline.createInterface({ input: process.stdin, output: process.stdout });
  const readline_loop = async () => {
    try {
      const line = await rli.question('');
      const segments = line.split(' ');
      const command = segments[0];
      switch (command) {
        default: {
          console.log(`Unhandled: ${line}`);
          break;
        }
      }
    } catch (e) {
      console.error(e);
    }
    process.nextTick(readline_loop);
  };
  process.nextTick(readline_loop);
});

/**
 * What's in here:
 * - Internal authentication server
 */
process.nextTick(async () => {

  const app = uwu.uws.App({});

  const __cwd = process.cwd();
  const __dist = path.join(__cwd, './client/dist/');

  app.get('/*', (res, req) => {
    let url_pathname = req.getUrl();
    if (url_pathname === '/') {
      url_pathname = '/index.html';
    }
    const file_path = path.join(__dist, url_pathname);
    if (fs.existsSync(file_path) === true) {
      const file_stat = fs.statSync(file_path);
      if (file_stat.isFile() === true) {
        const file_name = path.basename(url_pathname);
        const file_content_type = mime_types.contentType(file_name) || null;
        if (typeof file_content_type === 'string') {
          res.writeStatus('200');
          res.writeHeader('Content-Type', file_content_type);
          res.write(fs.readFileSync(file_path));
          res.end();
          return;
        }
        res.writeStatus('500');
        res.writeHeader('Content-Type', 'text/plain; charset=utf-8');
        res.write('500 Internal Server Error');
        res.end();
        return;
      }
    }
    res.writeStatus('404');
    res.writeHeader('Content-Type', 'text/plain; charset=utf-8');
    res.write('404 Not Found');
    res.end();
    return;
  });

  app.options('/*', uwu.use_middleware(async (response, request) => {
    response.status = 204;
    const access_control_request_method = request.headers.get('access-control-request-method');
    const origin = request.headers.get('origin');
    const access_control_allow_headers = ['content-type'];
    if (request.headers.has('access-control-request-headers') === true) {
      const access_control_request_headers = request.headers.get('access-control-request-headers').split(',');
      access_control_allow_headers.push(...access_control_request_headers);
    }
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', access_control_request_method);
    response.headers.set('Access-Control-Allow-Headers', access_control_allow_headers.join(','));
    response.headers.set('Access-Control-Max-Age', '300');
  }));

  await uwu.serve_http(app, uwu.port_access_types.EXCLUSIVE, 9091);
});