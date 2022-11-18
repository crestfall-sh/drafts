// @ts-check

import assert from 'assert';
import crypto from 'crypto';
import * as luxon from 'luxon';
import * as hs256 from 'modules/hs256.mjs';

export const refresh_tokens = new Set();

/**
 * exp: defaults to T + 15 Minutes
 * sub, role, email, scopes: defaults to null
 * @param {string} secret_b64
 * @param {import('modules/hs256').payload} payload_override
 * @returns {Promise<string>}
 */
export const create = async (secret_b64, payload_override) => {
  assert(typeof secret_b64 === 'string');
  assert(payload_override instanceof Object);
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
    sub: null,
    role: null,
    email: null,
    scopes: null,
    refresh_token: crypto.randomBytes(32).toString('hex'),
  };
  Object.assign(payload, payload_override);
  refresh_tokens.add(payload.refresh_token);
  const token = hs256.create_token(header, payload, secret_b64);
  return token;
};