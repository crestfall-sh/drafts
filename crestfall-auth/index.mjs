// @ts-check

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
import env from '../env.mjs';

console.log({ env });

assert(env.has('PGRST_JWT_SECRET') === true);
assert(env.has('PGRST_JWT_SECRET_IS_BASE64') === true);
assert(env.get('PGRST_JWT_SECRET_IS_BASE64') === 'true');

const secret = env.get('PGRST_JWT_SECRET');
console.log({ secret });

/**
 * What's in here:
 * - Internal authentication client, in your command line interface
 * - Enter the commands in your console to test them!
 * - /ct - creates an anon token
 * - /su - creates an anon token, signs-up a new user
 */
process.nextTick(async () => {

  // non-expiring anon token
  const create_anon_token = () => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      iat: luxon.DateTime.now().toSeconds(),
      nbf: luxon.DateTime.now().toSeconds(),
      role: 'anon',
    };
    const token = hs256.create_token(header, payload, secret);
    return token;
  };

  const rli = readline.createInterface({ input: process.stdin, output: process.stdout });
  const readline_loop = async () => {
    try {

      const line = await rli.question('');
      const segments = line.split(' ');
      const command = segments[0];
      switch (command) {
        case '/ct': {
          const anon_token = create_anon_token();
          console.log({ anon_token });
          const verified_token = hs256.verify_token(anon_token, secret);
          console.log({ verified_token });
          break;
        }
        case '/su': {
          const email = segments[1];
          assert(typeof email === 'string', 'ERR_INVALID_EMAIL');
          const password = segments[2];
          assert(typeof password === 'string', 'ERR_INVALID_PASSWORD');
          const anon_token = create_anon_token();
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
          const anon_token = create_anon_token();
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

  // non-expiring auth administrator token
  const create_auth_administrator_token = () => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      iat: luxon.DateTime.now().toSeconds(),
      nbf: luxon.DateTime.now().toSeconds(),
      role: 'auth_administrator',
    };
    const token = hs256.create_token(header, payload, secret);
    return token;
  };

  const auth_administrator_token = create_auth_administrator_token();

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

      // ensure got application/json request body
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

      const verified_token = hs256.verify_token(header_authorization_token, secret);
      assert(verified_token.payload.role === 'anon');

      // [x] ensure user does not exist
      {
        const pg_response = await fetch(`http://0.0.0.0:5433/users?email=eq.${email}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${auth_administrator_token}`,
            'Accept-Profile': 'auth',
          },
        });
        assert(pg_response.status === 200);
        const pg_response_json = await pg_response.json();
        assert(pg_response_json instanceof Array);
        assert(pg_response_json.length === 0, 'EMAIL_ALREADY_USED');
      }

      // [X] create user if it does not exist
      {
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

        const pg_response = await fetch('http://0.0.0.0:5433/users', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth_administrator_token}`,
            'Accept-Profile': 'auth',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(user),
        });
        assert(pg_response.status === 201);

        const pg_response_json = await pg_response.json();
        assert(pg_response_json instanceof Array);

        const inserted_user = pg_response_json[0];
        assert(inserted_user instanceof Object);

        Object.assign(user, inserted_user);

        user.invitation_code = null;
        user.verification_code = null;
        user.recovery_code = null;
        user.password_salt = null;
        user.password_key = null;

        response.status = 200;
        response.json.data = { user };
      }
    } catch (e) {
      console.error(e);
      const error = { request, name: e.name, code: e.code, message: e.message, stack: e.stack };
      response.status = 500;
      response.json.error = error;
    }
  }));

  app.post('/sign-in', uwu.use_middleware(async (response, request) => {
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin'));
    response.json = { data: null, error: null };
    try {

      // ensure got application/json request body
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

      const verified_token = hs256.verify_token(header_authorization_token, secret);
      assert(verified_token.payload.role === 'anon');

      // [x] ensure user does exist
      const pg_response = await fetch(`http://0.0.0.0:5433/users?email=eq.${email}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth_administrator_token}`,
          'Accept-Profile': 'auth',
        },
      });
      assert(pg_response.status === 200);

      const pg_response_json = await pg_response.json();
      assert(pg_response_json instanceof Array);
      assert(pg_response_json.length === 1, 'INVALID_EMAIL_OR_PASSWORD');

      /**
       * @type {user}
       */
      const user = pg_response_json[0];
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

      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = {
        iat: luxon.DateTime.now().toSeconds(),
        nbf: luxon.DateTime.now().toSeconds(),
        exp: luxon.DateTime.now().plus({ minutes: 15 }).toSeconds(),
        role: 'user_role',
      };
      const token = hs256.create_token(header, payload, secret);

      response.status = 200;
      response.json.data = { user, token };

    } catch (e) {
      console.error(e);
      const error = { request, name: e.name, code: e.code, message: e.message, stack: e.stack };
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