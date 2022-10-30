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
import * as luxon from 'luxon';
import * as uwu from 'modules/uwu.mjs';
import * as hs256 from 'modules/hs256.mjs';
import { full_casefold_normalize_nfkc } from 'modules/casefold.mjs';
import * as postgrest from '../../client/postgrest.mjs';
import env from '../env.mjs';

const scrypt_length = 64;

/**
 * - https://words.filippo.io/the-scrypt-parameters/
 * @type {import('crypto').ScryptOptions}
 */
const scrypt_options = { N: 2 ** 15, p: 1, maxmem: 128 * (2 ** 16) * 8 };

/**
 * @param {string} password utf-8 nfkc
 * @param {string} password_salt hex-encoded
 * @returns {Promise<Buffer>}
 */
const scrypt = async (password, password_salt) => {
  assert(typeof password === 'string');
  assert(typeof password_salt === 'string');
  /**
   * @type {Buffer}
   */
  const password_key_buffer = await new Promise((resolve, reject) => {
    crypto.scrypt(Buffer.from(password), Buffer.from(password_salt, 'hex'), scrypt_length, scrypt_options, (error, derived_key) => {
      if (error instanceof Error) {
        reject(error);
        return;
      }
      resolve(derived_key);
    });
  });
  return password_key_buffer;
};

const refresh_tokens = new Set();

/**
 * @param {string} sub
 * @param {string} role
 * @param {string} email
 * @param {string} secret_b64
 * @returns {Promise<string>}
 */
const create_token = async (sub, role, email, secret_b64) => {
  assert(typeof sub === 'string' || sub === null);
  assert(typeof role === 'string' || role === null);
  assert(typeof email === 'string' || email === null);
  assert(typeof secret_b64 === 'string');
  /**
   * @type {string[]}
   */
  let scopes = null;
  if (typeof sub === 'string') {
    scopes = await postgrest.read_authorization_scopes('http', '0.0.0.0', 5433, '', sub);
  }
  /**
   * @type {import('modules/hs256').header}
   */
  const header = { alg: 'HS256', typ: 'JWT' };
  /**
   * @type {import('modules/hs256').payload}
   */
  const payload = {
    iat: luxon.DateTime.now().toSeconds(),
    nbf: luxon.DateTime.now().toSeconds(),
    exp: luxon.DateTime.now().plus({ minutes: 15 }).toSeconds(),
    iss: 'crestfall',
    aud: 'crestfall',
    sub: sub,
    role: role,
    email: email,
    scopes: scopes,
    refresh_token: crypto.randomBytes(32).toString('hex'),
  };
  const token = hs256.create_token(header, payload, secret_b64);
  refresh_tokens.add(payload.refresh_token);
  return token;
};

const secret_b64 = env.get('PGRST_JWT_SECRET');

const auth_admin_token = await create_token(null, 'auth_admin', null, secret_b64);

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
     * @type {import('node-fetch').Response}
     */
    let postgrest_response = null;
    /**
     * @type {any}
     */
    let postgrest_response_body = null;
    try {
      postgrest_response = await fetch(`http://0.0.0.0:5433/users?email=eq.${email}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${auth_admin_token}`,
          'Accept-Profile': 'auth', // For GET or HEAD
          'Content-Profile': 'auth', // For POST, PATCH, PUT and DELETE
        },
      });
      assert(postgrest_response.status === 200);
      assert(postgrest_response.headers.has('content-type') === true);
      assert(postgrest_response.headers.get('content-type').includes('application/json') === true);
      postgrest_response_body = await postgrest_response.json();
      assert(postgrest_response_body instanceof Array);
      assert(postgrest_response_body.length === 0, 'ERR_EMAIL_ALREADY_USED');
    } catch (e) {
      if (postgrest_response instanceof Object) {
        const status = postgrest_response.status;
        const body = postgrest_response_body;
        console.error({ status, body });
      }
      throw e;
    }
  }
  // [x] Create user account and sign-in
  {
    /**
     * @type {import('node-fetch').Response}
     */
    let postgrest_response = null;
    /**
     * @type {any}
     */
    let postgrest_response_body = null;
    try {
      const verification_code = crypto.randomBytes(64).toString('hex');
      const password_salt = crypto.randomBytes(32).toString('hex');
      const password_key_buffer = await scrypt(password, password_salt);
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
      postgrest_response = await fetch('http://0.0.0.0:5433/users', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${auth_admin_token}`,
          'Accept-Profile': 'auth', // For GET or HEAD
          'Content-Profile': 'auth', // For POST, PATCH, PUT and DELETE
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(user),
      });
      assert(postgrest_response.status === 201);
      assert(postgrest_response.headers.has('content-type') === true);
      assert(postgrest_response.headers.get('content-type').includes('application/json') === true);
      postgrest_response_body = await postgrest_response.json();
      assert(postgrest_response_body instanceof Array);
      const inserted_user = postgrest_response_body[0];
      assert(inserted_user instanceof Object);
      Object.assign(user, inserted_user);
      user.invitation_code = null;
      user.verification_code = null;
      user.recovery_code = null;
      user.password_salt = null;
      user.password_key = null;
      const token = await create_token(user.id, 'public_user', user.email, secret_b64);
      return { user, token };
    } catch (e) {
      if (postgrest_response instanceof Object) {
        const status = postgrest_response.status;
        const body = postgrest_response_body;
        console.error({ status, body });
      }
      throw e;
    }
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
     * @type {import('node-fetch').Response}
     */
    let postgrest_response = null;
    /**
     * @type {any}
     */
    let postgrest_response_body = null;
    try {
      postgrest_response = await fetch(`http://0.0.0.0:5433/users?email=eq.${email}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${auth_admin_token}`,
          'Accept-Profile': 'auth', // For GET or HEAD
          'Content-Profile': 'auth', // For POST, PATCH, PUT and DELETE
        },
      });
      assert(postgrest_response.status === 200);
      assert(postgrest_response.headers.has('content-type') === true);
      assert(postgrest_response.headers.get('content-type').includes('application/json') === true);
      postgrest_response_body = await postgrest_response.json();
      assert(postgrest_response_body instanceof Array);
      assert(postgrest_response_body.length === 1, 'ERR_INVALID_EMAIL_OR_PASSWORD');
      /**
       * @type {user}
       */
      const user = postgrest_response_body[0];
      assert(user instanceof Object);
      assert(typeof user.password_salt === 'string');
      assert(typeof user.password_key === 'string');
      const user_password_key_buffer = Buffer.from(user.password_key, 'hex');
      const password_key_buffer = await scrypt(password, user.password_salt);
      assert(crypto.timingSafeEqual(user_password_key_buffer, password_key_buffer) === true, 'INVALID_EMAIL_OR_PASSWORD');
      user.invitation_code = null;
      user.verification_code = null;
      user.recovery_code = null;
      user.password_salt = null;
      user.password_key = null;
      const token = await create_token(user.id, 'public_user', user.email, secret_b64);
      return { user, token };
    } catch (e) {
      if (postgrest_response instanceof Object) {
        const status = postgrest_response.status;
        const body = postgrest_response_body;
        console.error({ status, body });
      }
      throw e;
    }
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
          const anon_token = await create_token(null, 'anon', null, secret_b64);
          console.log({ anon_token });
          const request_token = hs256.verify_token(anon_token, secret_b64);
          console.log({ request_token });
          break;
        }
        case '/su': {
          const email = segments[1];
          assert(typeof email === 'string', 'ERR_INVALID_EMAIL');
          const password = segments[2];
          assert(typeof password === 'string', 'ERR_INVALID_PASSWORD');
          const anon_token = await create_token(null, 'anon', null, secret_b64);
          console.log({ anon_token });
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
          const anon_token = await create_token(null, 'anon', null, secret_b64);
          console.log({ anon_token });
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

  app.post('/sign-in', uwu.use_middleware(async (response, request) => {
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin'));
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

  app.post('/refresh', uwu.use_middleware(async (response, request) => {
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin'));
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
      assert(refresh_tokens.has(request_token.payload.refresh_token) === true);
      refresh_tokens.delete(request_token.payload.refresh_token);
      const token = await create_token(request_token.payload.sub, request_token.payload.role, request_token.payload.email, secret_b64);
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