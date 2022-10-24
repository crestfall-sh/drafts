// @ts-check

import assert from 'assert';
import * as crestfall from './index.mjs';
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

const client = crestfall.initialize('http', 'localhost', anon_token);

process.nextTick(async () => {
  const sign_up_response = await client.sign_up('alice@gmail.com', 'test1234');
  console.log(JSON.stringify({ sign_up_response }, null, 2));
  {
    const sign_in_response = await client.sign_in('alice@gmail.com', 'test1234');
    console.log(JSON.stringify({ sign_in_response }, null, 2));
  }
  {
    const sign_out_response = await client.sign_out();
    console.log(JSON.stringify({ sign_out_response }, null, 2));
  }
  {
    const postgrest_response = await client.postgrest_request({ pathname: '/' });
    console.log(JSON.stringify({ postgrest_response }, null, 2));
  }
  {
    const sign_in_response = await client.sign_in('alice@gmail.com', 'test1234');
    console.log(JSON.stringify({ sign_in_response }, null, 2));
  }
  {
    // const tokens = client.tokens();
    // console.log({ tokens });
    // await new Promise((resolve) => setTimeout(resolve, (12 * 60 * 1000) + (30 * 1000)));
    const refresh_response = await client.refresh_token();
    console.log(JSON.stringify({ refresh_response }, null, 2));
  }
  {
    const postgrest_response = await client.postgrest_request({ pathname: '/' });
    console.log(JSON.stringify({ postgrest_response }, null, 2));
    const tokens = client.tokens();
    console.log({ tokens });
    const authenticated_token = hs256.read_token(tokens.authenticated_token);
    console.log({ authenticated_token });
  }
});