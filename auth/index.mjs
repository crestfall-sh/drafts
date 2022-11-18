// @ts-check

/**
 * - https://postgrest.org/en/stable/api.html?highlight=Accept-Profile#switching-schemas
 */

/**
 * @typedef {import('./index').user} user
 */

import assert from 'assert';
import crypto from 'crypto';
import readline from 'node:readline/promises';
import fetch from 'node-fetch';
import * as uwu from 'modules/uwu.mjs';
import * as hs256 from 'modules/hs256.mjs';
import { full_casefold_normalize_nfkc } from 'modules/casefold.mjs';
import * as postgrest from '../client/postgrest.mjs';
import * as tokens from './tokens.mjs';
import * as scrypt from './scrypt.mjs';
import env from '../env.mjs';

const secret_b64 = env.get('PGRST_JWT_SECRET');

const anon_token = await tokens.create(secret_b64, { exp: null, role: 'anon' });
const public_admin_token = await tokens.create(secret_b64, { exp: null, role: 'public_admin' });
const auth_admin_token = await tokens.create(secret_b64, { exp: null, role: 'auth_admin' });

/**
 * @param {string} user_id
 * @returns {Promise<string[]>}
 */
const read_scopes = async (user_id) => {
  assert(typeof user_id === 'string');
  const scopes = await postgrest.read_authorization_scopes('http', '0.0.0.0', 5433, public_admin_token, user_id);
  return scopes;
};

/**
 * @param {string} header_authorization_token
 * @param {string} email
 * @param {string} password
 */
const sign_up = async (header_authorization_token, email, password) => {
  // [x] Validate request header authorization token
  const request_token = hs256.verify_token(header_authorization_token, secret_b64);
  assert(request_token.payload.iss === 'crestfall');
  assert(request_token.payload.aud === 'crestfall');
  assert(request_token.payload.sub === null);
  assert(request_token.payload.role === 'anon');

  // [x] Check if email address already used
  {
    /**
     * @type {import('../client/postgrest').response<user[]>}
     */
    const response = await postgrest.request({
      protocol: 'http',
      hostname: '0.0.0.0',
      port: 5433,
      token: auth_admin_token,
      pathname: '/users',
      search: {
        email: `eq.${email}`,
      },
      method: 'GET',
      headers: {
        'Accept-Profile': 'auth', // For GET or HEAD
        'Content-Profile': 'auth', // For POST, PATCH, PUT and DELETE
      },
    });
    if (response.status !== 200) {
      console.error({ response });
    }
    assert(response.status === 200);
    assert(response.body instanceof Array);
    assert(response.body.length === 0, 'ERR_EMAIL_ALREADY_USED');
  }

  // [x] Create user account and sign-in
  {
    const verification_code = crypto.randomBytes(64).toString('hex');
    const password_salt = scrypt.salt();
    const password_key_buffer = scrypt.derive(password, password_salt);
    const password_key = password_key_buffer.toString('hex');
    /**
     * @type {user}
     */
    const user = {
      id: undefined,
      email: email,
      invitation_code: null,
      invited_at: null,
      verification_code: verification_code,
      verified_at: null,
      recovery_code: null,
      recovered_at: null,
      password_salt: password_salt,
      password_key: password_key,
      metadata: {},
      created_at: undefined,
      updated_at: undefined,
    };
    /**
     * @type {import('../client/postgrest').response<user[]>}
     */
    const response = await postgrest.request({
      protocol: 'http',
      hostname: '0.0.0.0',
      port: 5433,
      token: auth_admin_token,
      pathname: '/users',
      method: 'POST',
      headers: {
        'Accept-Profile': 'auth', // For GET or HEAD
        'Content-Profile': 'auth', // For POST, PATCH, PUT and DELETE
        'Prefer': 'return=representation',
      },
      json: user,
    });
    if (response.status !== 201) {
      console.error({ response });
    }
    assert(response.status === 201);
    assert(response.body instanceof Array);
    const inserted_user = response.body[0];
    assert(inserted_user instanceof Object);
    Object.assign(user, inserted_user);
    user.invitation_code = null;
    user.verification_code = null;
    user.recovery_code = null;
    user.password_salt = null;
    user.password_key = null;
    const scopes = await read_scopes(user.id);
    const token = await tokens.create(secret_b64, {
      sub: user.id,
      role: 'public_user',
      email: user.email,
      scopes,
    });
    return { user, token };
  }
};

/**
 * @param {string} header_authorization_token
 * @param {string} email
 * @param {string} password
 */
const sign_in = async (header_authorization_token, email, password) => {
  // [x] Validate request header authorization token
  const request_token = hs256.verify_token(header_authorization_token, secret_b64);
  assert(request_token.payload.iss === 'crestfall');
  assert(request_token.payload.aud === 'crestfall');
  assert(request_token.payload.sub === null);
  assert(request_token.payload.role === 'anon');
  // [x] Check if user exists
  {
    /**
     * @type {import('../client/postgrest').response<user[]>}
     */
    const response = await postgrest.request({
      protocol: 'http',
      hostname: '0.0.0.0',
      port: 5433,
      token: auth_admin_token,
      pathname: '/users',
      search: {
        email: `eq.${email}`,
      },
      method: 'GET',
      headers: {
        'Accept-Profile': 'auth', // For GET or HEAD
        'Content-Profile': 'auth', // For POST, PATCH, PUT and DELETE
      },
    });
    if (response.status !== 200) {
      console.error({ response });
    }
    assert(response.status === 200);
    assert(response.body instanceof Array);
    assert(response.body.length === 1, 'ERR_INVALID_EMAIL_OR_PASSWORD');
    /**
     * @type {user}
     */
    const user = response.body[0];
    assert(user instanceof Object);
    assert(typeof user.password_salt === 'string');
    assert(typeof user.password_key === 'string');
    const user_password_key_buffer = Buffer.from(user.password_key, 'hex');
    const password_key_buffer = scrypt.derive(password, user.password_salt);
    assert(scrypt.compare(user_password_key_buffer, password_key_buffer) === true, 'INVALID_EMAIL_OR_PASSWORD');
    user.invitation_code = null;
    user.verification_code = null;
    user.recovery_code = null;
    user.password_salt = null;
    user.password_key = null;
    const scopes = await read_scopes(user.id);
    const token = await tokens.create(secret_b64, {
      sub: user.id,
      role: 'public_user',
      email: user.email,
      scopes,
    });
    return { user, token };
  }
};

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
        case '/ct': {
          const request_token = hs256.verify_token(anon_token, secret_b64);
          console.log({ request_token });
          break;
        }
        case '/su': {
          const email = segments[1];
          assert(typeof email === 'string', 'ERR_INVALID_EMAIL');
          const password = segments[2];
          assert(typeof password === 'string', 'ERR_INVALID_PASSWORD');
          const response = await fetch('http://0.0.0.0:9090/sign-up', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anon_token}`,
            },
            body: JSON.stringify({ email: email, password: password }),
          });
          console.log(response.status);
          console.log(response.headers);
          const response_json = await response.json();
          console.log(JSON.stringify(response_json, null, 2));
          break;
        }
        case '/si': {
          const email = segments[1];
          assert(typeof email === 'string', 'ERR_INVALID_EMAIL');
          const password = segments[2];
          assert(typeof password === 'string', 'ERR_INVALID_PASSWORD');
          const response = await fetch('http://0.0.0.0:9090/sign-in', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anon_token}`,
            },
            body: JSON.stringify({ email: email, password: password }),
          });
          console.log(response.status);
          console.log(response.headers);
          const response_json = await response.json();
          console.log(JSON.stringify(response_json, null, 2));
          break;
        }
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

  app.get('/tokens/anon', (res, req) => {
    res.writeStatus('200');
    res.writeHeader('Content-Type', 'text/plain; charset=utf-8');
    res.writeHeader('Access-Control-Allow-Origin', req.getHeader('origin'));
    res.writeHeader('Access-Control-Allow-Credentials', 'true');
    res.write(anon_token);
    res.end();
  });

  app.options('/*', uwu.use(async (response, request) => {
    console.log({ request });
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
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '300');
    console.log({ response });
  }));

  app.post('/sign-up', uwu.use(async (response, request) => {
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin'));
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.json = { data: null, error: null };
    try {
      assert(request.json instanceof Object);
      /**
       * @type {string}
       */
      const email = full_casefold_normalize_nfkc(String(request.json.email));
      assert(typeof email === 'string');
      /**
       * @type {string}
       */
      const password = String(request.json.password).normalize('NFKC');
      assert(typeof password === 'string');
      const header_authorization = request.headers.get('Authorization');
      assert(typeof header_authorization === 'string');
      assert(header_authorization.substring(0, 7) === 'Bearer ');
      const header_authorization_token = header_authorization.substring(7);
      assert(typeof header_authorization_token === 'string');
      const { user, token } = await sign_up(header_authorization_token, email, password);
      response.status = 200;
      response.json.data = { user, token };
    } catch (e) {
      console.error(e);
      const error = { request, name: e.name, message: e.message, stack: e.stack };
      response.status = 500;
      response.json.error = error;
    }
  }));

  app.post('/sign-in', uwu.use(async (response, request) => {
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin'));
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.json = { data: null, error: null };
    try {
      assert(request.json instanceof Object);
      /**
       * @type {string}
       */
      const email = full_casefold_normalize_nfkc(String(request.json.email));
      assert(typeof email === 'string');
      /**
       * @type {string}
       */
      const password = String(request.json.password).normalize('NFKC');
      assert(typeof password === 'string');
      const header_authorization = request.headers.get('Authorization');
      assert(typeof header_authorization === 'string');
      assert(header_authorization.substring(0, 7) === 'Bearer ');
      const header_authorization_token = header_authorization.substring(7);
      assert(typeof header_authorization_token === 'string');
      const { user, token } = await sign_in(header_authorization_token, email, password);
      response.status = 200;
      response.json.data = { user, token };
    } catch (e) {
      console.error(e);
      const error = { request, name: e.name, message: e.message, stack: e.stack };
      response.status = 500;
      response.json.error = error;
    }
  }));

  app.post('/refresh', uwu.use(async (response, request) => {
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin'));
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.json = { data: null, error: null };
    try {
      assert(request.json instanceof Object);
      const header_authorization = request.headers.get('Authorization');
      assert(typeof header_authorization === 'string');
      assert(header_authorization.substring(0, 7) === 'Bearer ');
      const header_authorization_token = header_authorization.substring(7);
      assert(typeof header_authorization_token === 'string');
      const request_token = hs256.verify_token(header_authorization_token, secret_b64);
      assert(request_token.payload.iss === 'crestfall');
      assert(request_token.payload.aud === 'crestfall');
      assert(typeof request_token.payload.refresh_token === 'string');
      assert(tokens.refresh_tokens.has(request_token.payload.refresh_token) === true);
      tokens.refresh_tokens.delete(request_token.payload.refresh_token);
      const scopes = await read_scopes(request_token.payload.sub);
      const token = await tokens.create(secret_b64, {
        sub: request_token.payload.sub,
        role: request_token.payload.role,
        email: request_token.payload.email,
        scopes,
      });
      response.status = 200;
      response.json.data = { token };
    } catch (e) {
      console.error(e);
      const error = { request, name: e.name, message: e.message, stack: e.stack };
      response.status = 500;
      response.json.error = error;
    }
  }));

  /**
   * @type {import('modules/uwu').middleware}
   */
  const serve_404 = async (response, request) => {
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin'));
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    const error = { request, name: 'Not Found', code: 'ERR_NOT_FOUND', message: null, stack: null };
    response.status = 404;
    response.json = { data: null, error };
  };
  app.get('/*', uwu.use(serve_404));
  app.post('/*', uwu.use(serve_404));
  app.patch('/*', uwu.use(serve_404));
  app.put('/*', uwu.use(serve_404));
  app.del('/*', uwu.use(serve_404));

  await uwu.http(app, uwu.port_access_types.EXCLUSIVE, 9090);

  console.log('Auth server listening at port 9090.');
});