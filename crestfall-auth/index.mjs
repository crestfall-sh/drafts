// @ts-check

import assert from 'assert';
import readline from 'node:readline/promises';
import fetch from 'node-fetch';
import * as uwu from 'modules/uwu.mjs';

import * as hs256 from './hs256.mjs';
import env from '../env.mjs';

console.log({ env });

assert(env.has('PGRST_JWT_SECRET') === true);
assert(env.has('PGRST_JWT_SECRET_IS_BASE64') === true);
assert(env.get('PGRST_JWT_SECRET_IS_BASE64') === 'true');

const secret = env.get('PGRST_JWT_SECRET');
console.log({ secret });

const rli = readline.createInterface({ input: process.stdin, output: process.stdout });

const readline_loop = async () => {
  const line = await rli.question('');
  switch (line) {
    case '/ct': {
      const header = { alg: 'HS256', typ: 'JWT' };
      console.log({ header });
      const payload = { role: 'anon' };
      console.log({ payload });
      const token = hs256.create_token(header, payload, secret);
      console.log({ token });
      const verified = hs256.verify_token(token, secret);
      console.log({ verified });
      break;
    }
    default: {
      console.log(`Unhandled: ${line}`);
      break;
    }
  }
  process.nextTick(readline_loop);
};
process.nextTick(readline_loop);

process.nextTick(async () => {

  const app = uwu.uws.App({});
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

  app.post('/sign-up', uwu.use_middleware(async (response, request) => {
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin'));
    try {

      // ensure got application/json request body
      assert(request.json instanceof Object);

      /**
       * @type {string}
       */
      const email = request.json.email;
      assert(typeof email === 'string');

      /**
       * @type {string}
       */
      const password = request.json.password;
      assert(typeof password === 'string');

      const header_authorization = request.headers.get('Authorization ');
      assert(typeof header_authorization === 'string');
      assert(header_authorization.substring(0, 7) === 'Bearer ');

      const header_authorization_token = header_authorization.substring(7);
      assert(typeof header_authorization_token === 'string');

      const verified_token = hs256.verify_token(header_authorization_token, secret);
      console.log({ verified_token });

      // [ ] ensure user does not exist

      // [ ] create user if it does not exist

      response.status = 200;
      response.json = { data: null, error: null };

    } catch (e) {
      console.error(e);
      const error = { request, name: e.name, code: e.code, message: e.message, stack: e.stack };
      response.status = 500;
      response.json = { data: null, error };
    }
  }));

  /**
   * @type {import('modules/uwu').middleware}
   */
  const serve_404 = async (response, request) => {
    const error = { request, name: 'Not Found', code: 'ERR_NOT_FOUND', message: null, stack: null };
    response.status = 404;
    response.json = { data: null, error };
  };
  app.get('/*', uwu.use_middleware(serve_404));
  app.post('/*', uwu.use_middleware(serve_404));
  app.patch('/*', uwu.use_middleware(serve_404));
  app.put('/*', uwu.use_middleware(serve_404));
  app.del('/*', uwu.use_middleware(serve_404));

  await uwu.serve_http(app, uwu.port_access_types.EXCLUSIVE, 9090);
});