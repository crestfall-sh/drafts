// @ts-check

/**
 * TODO
 * - [ ] check token expiry
 * - [ ] refresh expired tokens
 */

import { assert } from 'modules/assert.mjs';
import fetch from 'cross-fetch';

export const CRESTFALL_AUTH_PORT = 9090;

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
  const authenticated_token = null;

  /**
   * @param {string} email
   * @param {string} password
   */
  const sign_up = async (email, password) => {
    assert(typeof email === 'string', 'ERR_INVALID_EMAIL');
    assert(typeof password === 'string', 'ERR_INVALID_PASSWORD');
    const request_method = 'POST';
    const request_url = `${protocol}://${host}:${CRESTFALL_AUTH_PORT}/sign-up`;
    const request_token = authenticated_token || default_token;
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
    return { status, body };
  };

  /**
   * @param {string} email
   * @param {string} password
   */
  const sign_in = async (email, password) => {
    assert(typeof email === 'string', 'ERR_INVALID_EMAIL');
    assert(typeof password === 'string', 'ERR_INVALID_PASSWORD');
    const request_method = 'POST';
    const request_url = `${protocol}://${host}:${CRESTFALL_AUTH_PORT}/sign-in`;
    const request_token = authenticated_token || default_token;
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
    return { status, body };
  };

  const client = { sign_up, sign_in };
  return client;
};
