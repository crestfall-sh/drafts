// @ts-check

/**
 * TODO
 * - [x] check token expiry
 * - [x] refresh expired tokens
 * - [ ] test sql queries
 * - [ ] test authorization (roles, permissions)
 * - [ ] function to authorize and deauthorize
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
   * Note: not necessary for sign-in and sign-up
   */
  const refresh_token = async () => {
    assert(typeof authenticated_token === 'string', 'ERR_ALREADY_SIGNED_OUT');
    const token = hs256.read_token(authenticated_token);
    assert(token instanceof Object);
    assert(token.payload instanceof Object);
    assert(typeof token.payload.exp === 'number');
    const exp = luxon.DateTime.fromSeconds(token.payload.exp);
    assert(exp.isValid === true);
    const now = luxon.DateTime.now();
    assert(now < exp, 'ERR_SESSION_EXPIRED');
    const refresh_window = exp.minus({ minutes: 3 });
    if (refresh_window < now) {
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
    }
    return null;
  };

  /**
   * @param {string} email
   * @param {string} password
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
   * @param {string} email
   * @param {string} password
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
    assert(typeof options.method === 'string');
    assert(typeof options.pathname === 'string');
    assert(options.search instanceof Object);
    const request_method = options.method;
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
    const request_body = JSON.stringify(options.json instanceof Object ? options.json : null);
    const response = await fetch(request_url, { method: request_method, headers: request_headers, body: request_body });
    assert(response.headers.has('content-type') === true);
    assert(response.headers.get('content-type').includes('application/json') === true);
    const status = response.status;
    const headers = response.headers;
    const body = await response.json();
    return { status, headers, body };
  };

  const client = { refresh_token, sign_up, sign_in, sign_out, tokens, postgrest_request };
  return client;
};
