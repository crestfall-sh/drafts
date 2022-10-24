// @ts-check

/**
 * TODO
 * - [x] check token expiry
 * - [x] refresh expired tokens
 * - [x] test postgrest queries with bearer tokens
 * - [ ] fetch authorization (roles, permissions)
 * - [ ] function to authorize and deauthorize
 * - [ ] auto-refresh tokens using setInterval
 */

import fetch from 'cross-fetch';
import assert from 'modules/assert.mjs';
import * as hs256 from 'modules/hs256.mjs';
import * as luxon from 'luxon';

export const CRESTFALL_AUTH_PORT = 9090;
export const CRESTFALL_POSTGREST_PORT = 5433;

/**
 * @param {string} protocol
 * @param {string} host
 * @param {string} default_token
 */
export const initialize = (protocol, host, default_token) => {
  assert(typeof protocol === 'string');
  assert(typeof host === 'string');
  assert(typeof default_token === 'string');

  /**
   * @type {string}
   */
  let authenticated_token = null;

  /**
   * @type {import('./index').refresh_token}
   */
  const refresh_token = async () => {
    assert(typeof authenticated_token === 'string', 'ERR_ALREADY_SIGNED_OUT');
    const request_method = 'POST';
    const request_url = `${protocol}://${host}:${CRESTFALL_AUTH_PORT}/refresh`;
    const request_token = authenticated_token;
    const request_headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${request_token}`,
    };
    const request_body = JSON.stringify({});
    const response = await fetch(request_url, { method: request_method, headers: request_headers, body: request_body });
    assert(response.headers.has('content-type') === true);
    assert(response.headers.get('content-type').includes('application/json') === true);
    const status = response.status;
    const body = await response.json();
    if (body instanceof Object) {
      if (body.data instanceof Object) {
        if (typeof body.data.token === 'string') {
          authenticated_token = body.data.token;
        }
      }
    }
    return { status, body };
  };

  /**
   * Note: not necessary for sign-in and sign-up
   */
  const check_refresh_token = async () => {
    assert(typeof authenticated_token === 'string', 'ERR_ALREADY_SIGNED_OUT');
    const token = hs256.read_token(authenticated_token);
    assert(token instanceof Object);
    assert(token.payload instanceof Object);
    assert(typeof token.payload.exp === 'number');
    const exp = luxon.DateTime.fromSeconds(token.payload.exp);
    assert(exp.isValid === true);
    const now = luxon.DateTime.now();
    if (exp <= now) {
      authenticated_token = null;
      throw new Error('ERR_TOKEN_EXPIRED_ALREADY_SIGNED_OUT');
    }
    const refresh_window = exp.minus({ minutes: 3 });
    if (refresh_window < now) {
      await refresh_token();
    }
    return null;
  };

  /**
   * @type {import('./index').sign_up}
   */
  const sign_up = async (email, password) => {
    assert(typeof email === 'string', 'ERR_INVALID_EMAIL');
    assert(typeof password === 'string', 'ERR_INVALID_PASSWORD');
    assert(authenticated_token === null, 'ERR_ALREADY_SIGNED_IN');
    const request_method = 'POST';
    const request_url = `${protocol}://${host}:${CRESTFALL_AUTH_PORT}/sign-up`;
    const request_token = default_token;
    const request_headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${request_token}`,
    };
    const request_body = JSON.stringify({ email: email, password: password });
    const response = await fetch(request_url, { method: request_method, headers: request_headers, body: request_body });
    assert(response.headers.has('content-type') === true);
    assert(response.headers.get('content-type').includes('application/json') === true);
    const status = response.status;
    const body = await response.json();
    if (body instanceof Object) {
      if (body.data instanceof Object) {
        if (typeof body.data.token === 'string') {
          authenticated_token = body.data.token;
        }
      }
    }
    return { status, body };
  };

  /**
   * @type {import('./index').sign_in}
   */
  const sign_in = async (email, password) => {
    assert(typeof email === 'string', 'ERR_INVALID_EMAIL');
    assert(typeof password === 'string', 'ERR_INVALID_PASSWORD');
    assert(authenticated_token === null, 'ERR_ALREADY_SIGNED_IN');
    const request_method = 'POST';
    const request_url = `${protocol}://${host}:${CRESTFALL_AUTH_PORT}/sign-in`;
    const request_token = default_token;
    const request_headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${request_token}`,
    };
    const request_body = JSON.stringify({ email: email, password: password });
    const response = await fetch(request_url, { method: request_method, headers: request_headers, body: request_body });
    assert(response.headers.has('content-type') === true);
    assert(response.headers.get('content-type').includes('application/json') === true);
    const status = response.status;
    const body = await response.json();
    if (body instanceof Object) {
      if (body.data instanceof Object) {
        if (typeof body.data.token === 'string') {
          authenticated_token = body.data.token;
        }
      }
    }
    return { status, body };
  };

  const sign_out = async () => {
    assert(typeof authenticated_token === 'string', 'ERR_ALREADY_SIGNED_OUT');
    authenticated_token = null;
    return null;
  };

  const tokens = () => {
    return { default_token, authenticated_token };
  };

  /**
   * @type {import('./index').postgrest_request}
   */
  const postgrest_request = async (options) => {
    assert(options instanceof Object);
    assert(options.method === undefined || typeof options.method === 'string');
    assert(options.headers === undefined || options.headers instanceof Object);
    assert(typeof options.pathname === 'string');
    assert(options.search === undefined || options.search instanceof Object);
    const request_method = options.method || 'GET';
    const request_token = authenticated_token || default_token;
    const request_headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${request_token}`,
    };
    if (options.headers instanceof Object) {
      Object.assign(request_headers, options.headers);
    }
    const request_url = new URL(`${protocol}://${host}:${CRESTFALL_POSTGREST_PORT}`);
    request_url.pathname = options.pathname;
    if (options.search instanceof Object) {
      request_url.search = new URLSearchParams(options.search).toString();
    }
    let request_body = undefined;
    if (request_method !== 'HEAD' && request_method !== 'GET') {
      if (options.json instanceof Object) {
        request_body = JSON.stringify(options.json);
      }
    }
    const response = await fetch(request_url, {
      method: request_method,
      headers: request_headers,
      body: request_body,
    });
    assert(response.headers.has('content-type') === true);
    assert(response.headers.get('content-type').includes('application/openapi+json') === true || response.headers.get('content-type').includes('application/json') === true);
    const status = response.status;
    const headers = response.headers;
    const body = await response.json();
    return { status, headers, body };
  };

  const client = { check_refresh_token, sign_up, sign_in, sign_out, tokens, postgrest_request };
  return client;
};
