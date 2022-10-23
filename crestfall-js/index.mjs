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
  let authenticated_token = null;

  // [ ] token refresh check for sign-up
  // [ ] token refresh check for sign-in
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

  const client = { refresh_token, sign_up, sign_in, sign_out, tokens };
  return client;
};
