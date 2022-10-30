// @ts-check

/**
 * @typedef {import('./index').user} user
 * @typedef {import('./index').role} role
 * @typedef {import('./index').permission} permission
 * @typedef {import('./index').assignment} assignment
 */

import assert from 'assert';
import * as crestfall from './index.mjs';
import * as postgrest from './postgrest.mjs';
import env from './env.mjs';
import * as hs256 from 'modules/hs256.mjs';
import * as luxon from 'luxon';

assert(env.has('PGRST_JWT_SECRET') === true);
assert(env.has('PGRST_JWT_SECRET_IS_BASE64') === true);
assert(env.get('PGRST_JWT_SECRET_IS_BASE64') === 'true');

const PGRST_JWT_SECRET = env.get('PGRST_JWT_SECRET');
console.log({ PGRST_JWT_SECRET });

/**
 * Create non-expiring anon token.
 * @param {string} secret
 * @returns {string}
 */
const create_anon_token = (secret) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    iat: luxon.DateTime.now().toSeconds(),
    nbf: luxon.DateTime.now().toSeconds(),
    exp: null,
    iss: 'crestfall',
    aud: 'crestfall',
    sub: null,
    role: 'anon',
    email: null,
  };
  const token = hs256.create_token(header, payload, secret);
  return token;
};

const anon_token = create_anon_token(PGRST_JWT_SECRET);
console.log({ anon_token });

/**
 * Create non-expiring auth admin token.
 * @param {string} secret
 * @returns {string}
 */
const create_public_admin_token = (secret) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    iat: luxon.DateTime.now().toSeconds(),
    nbf: luxon.DateTime.now().toSeconds(),
    exp: null,
    iss: 'crestfall',
    aud: 'crestfall',
    sub: null,
    role: 'public_admin',
    email: null,
    refresh_token: null,
  };
  const token = hs256.create_token(header, payload, secret);
  return token;
};

const public_admin_token = create_public_admin_token(PGRST_JWT_SECRET);
console.log({ public_admin_token });

/**
 * Create non-expiring auth admin token.
 * @param {string} secret
 * @returns {string}
 */
const create_auth_admin_token = (secret) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    iat: luxon.DateTime.now().toSeconds(),
    nbf: luxon.DateTime.now().toSeconds(),
    exp: null,
    iss: 'crestfall',
    aud: 'crestfall',
    sub: null,
    role: 'auth_admin',
    email: null,
    refresh_token: null,
  };
  const token = hs256.create_token(header, payload, secret);
  return token;
};

const auth_admin_token = create_auth_admin_token(PGRST_JWT_SECRET);
console.log({ auth_admin_token });

const client = crestfall.initialize('http', '0.0.0.0', 9090, anon_token);

process.nextTick(async () => {
  {
    // const postgrest_response = await postgrest.request({
    //   protocol: 'http',
    //   host: '0.0.0.0',
    //   port: 5433,
    //   token: anon_token,
    //   pathname: '/',
    // });
    // console.log(JSON.stringify({ postgrest_response }, null, 2));
  }
  {
    const sign_up_response = await client.sign_up('alice@gmail.com', 'test1234');
    console.log(JSON.stringify({ sign_up_response }, null, 2));
    if (sign_up_response.status === 200) {
      const sign_out_response = await client.sign_out();
      console.log(JSON.stringify({ sign_out_response }, null, 2));
    }
  }
  {

    const sign_in_response = await client.sign_in('alice@gmail.com', 'test1234');
    console.log(JSON.stringify({ sign_in_response }, null, 2));
    assert(sign_in_response.status === 200);

    /**
     * @type {import('./postgrest').response<role[]>}
     */
    const roles_response = await postgrest.request({
      protocol: 'http',
      host: '0.0.0.0',
      port: 5433,
      token: public_admin_token,
      method: 'GET',
      pathname: '/roles',
    });
    console.log(JSON.stringify({ roles_response }, null, 2));
    const roles = roles_response.body;
    assert(roles instanceof Array);
    const administrator = roles.find((role) => role.name === 'administrator');
    assert(administrator instanceof Object);
    const moderator = roles.find((role) => role.name === 'moderator');
    assert(moderator instanceof Object);

    /**
     * @type {assignment}
     */
    const assignment = {
      id: undefined,
      user_id: sign_in_response.body.data.user.id,
      role_id: administrator.id,
    };
    console.log({ assignment });

    /**
     * @type {import('./postgrest').response<assignment[]>}
     */
    const assignment_response = await postgrest.request({
      protocol: 'http',
      host: '0.0.0.0',
      port: 5433,
      token: public_admin_token,
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      pathname: '/assignments',
      json: assignment,
    });
    console.log(JSON.stringify({ assignment_response }, null, 2));
    if (assignment_response.status === 201) {
      console.log('assignments: INSERT OK');
      const refresh_response = await client.refresh_token();
      console.log(JSON.stringify({ refresh_response }, null, 2));
    }

  }
  {
    // const tokens = client.tokens();
    // console.log({ tokens });
    // await new Promise((resolve) => setTimeout(resolve, (12 * 60 * 1000) + (30 * 1000)));
    // const check_refresh_response = await client.check_refresh_token();
    // console.log(JSON.stringify({ check_refresh_response }, null, 2));
  }
  {
    // const postgrest_response = await postgrest.request({
    //   protocol: 'http',
    //   host: '0.0.0.0',
    //   port: 5433,
    //   token: anon_token,
    //   pathname: '/',
    // });
    // console.log(JSON.stringify({ postgrest_response }, null, 2));
    const tokens = client.tokens();
    console.log({ tokens });
    const authenticated_token_data = hs256.read_token(tokens.authenticated_token);
    console.log(JSON.stringify({ authenticated_token_data }, null, 2));
  }
  {
    const authenticated_token = client.tokens().authenticated_token;
    const authenticated_token_data = hs256.read_token(authenticated_token);
    console.log(JSON.stringify({ authenticated_token_data }, null, 2));
    const authorization_scopes = await postgrest.read_authorization_scopes('http', '0.0.0.0', 5433, authenticated_token, null);
    console.log(JSON.stringify({ authorization_scopes }, null, 2));
  }
});