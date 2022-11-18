// @ts-check

/**
 * TODO
 * - [x] check token expiry
 * - [x] refresh expired tokens
 * - [x] test postgrest queries with bearer tokens
 * - [ ] fetch authorization (roles, permissions)
 * - [ ] function to authorize and deauthorize
 * - [ ] auto-refresh tokens using setInterval
 * - [ ] event emitter interface for auth state change
 * - https://httpstatuses.io/
 */

/**
 * @typedef {import('./index').user} user
 * @typedef {import('./index').public_user} public_user
 * @typedef {import('./index').role} role
 * @typedef {import('./index').permission} permission
 * @typedef {import('./index').assignment} assignment
 */

import fetch from 'cross-fetch';
import assert from 'modules/assert.mjs';
import * as hs256 from 'modules/hs256.mjs';
import * as luxon from 'luxon';
import * as postgrest from './postgrest.mjs';

/**
 * @param {string} protocol
 * @param {string} hostname
 * @param {number} port
 * @param {string} anon_token
 */
export const initialize = (protocol, hostname, port, anon_token) => {
  assert(typeof protocol === 'string');
  assert(typeof hostname === 'string');
  assert(typeof port === 'number');
  assert(typeof anon_token === 'string');

  const anon_token_data = hs256.read_token(anon_token);

  /**
   * @type {string}
   */
  let authenticated_token = null;

  /**
   * @type {import('modules/hs256').token_data}
   */
  let authenticated_token_data = null;

  /**
   * @type {number}
   */
  let interval = null;

  /**
   * @type {import('./index').subscribers}
   */
  const subscribers = new Set();

  /**
   * @type {import('./index').subscribe}
   */
  const subscribe = (callback) => {
    console.log('crestfall: subscribing..');
    assert(callback instanceof Function);
    subscribers.add(callback);
    callback(authenticated_token, authenticated_token_data);
  };

  /**
   * @type {import('./index').subscribe}
   */
  const unsubscribe = (callback) => {
    console.log('crestfall: unsubscribing..');
    assert(callback instanceof Function);
    subscribers.delete(callback);
  };

  const enable_interval = () => {
    if (interval === null) {
      console.log('crestfall: enabling interval..');
      interval = setInterval(async () => {
        try {
          await check_refresh_token();
        } catch (e) {
          console.error(e);
        }
      }, 5000);
    }
  };

  const disable_interval = () => {
    if (typeof interval === 'number') {
      console.log('crestfall: disabling interval..');
      clearInterval(interval);
    }
  };

  const broadcast = () => {
    console.log('crestfall: broadcasting..');
    if (subscribers.size > 0) {
      subscribers.forEach((listener) => {
        listener(authenticated_token, authenticated_token_data);
      });
    }
  };

  const save = () => {
    console.log('crestfall: saving..');
    if (typeof window !== 'undefined' && window instanceof Object) {
      if (window.localStorage instanceof Object) {
        if (typeof authenticated_token === 'string') {
          window.localStorage.setItem('crestfall_authenticated_token', authenticated_token);
        } else {
          window.localStorage.removeItem('crestfall_authenticated_token');
        }
      }
    }
    if (typeof authenticated_token === 'string') {
      queueMicrotask(enable_interval);
    } else {
      queueMicrotask(disable_interval);
    }
    queueMicrotask(broadcast);
  };

  const load = () => {
    console.log('crestfall: loading..');
    if (typeof window !== 'undefined' && window instanceof Object) {
      if (window.localStorage instanceof Object) {
        const crestfall_authenticated_token = window.localStorage.getItem('crestfall_authenticated_token');
        if (typeof crestfall_authenticated_token === 'string') {
          const token = crestfall_authenticated_token;
          const token_data = hs256.read_token(token);
          const exp = luxon.DateTime.fromSeconds(token_data.payload.exp);
          assert(exp.isValid === true);
          console.log(`crestfall: exp: ${exp.toISO()} (${exp.toRelative()})`);
          const now = luxon.DateTime.now();
          console.log(`crestfall: now: ${now.toISO()} (${now.toRelative()})`);
          if (now < exp) {
            authenticated_token = token;
            authenticated_token_data = token_data;
            queueMicrotask(save);
          } else {
            authenticated_token = null;
            authenticated_token_data = null;
            queueMicrotask(save);
          }
        }
      }
    }
  };
  queueMicrotask(load);

  /**
   * @type {import('./index').refresh_token}
   */
  const refresh_token = async () => {
    assert(typeof authenticated_token === 'string', 'ERR_ALREADY_SIGNED_OUT');
    const request_method = 'POST';
    const request_url = `${protocol}://${hostname}:${port}/refresh`;
    const request_token = authenticated_token;
    const request_headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${request_token}`,
    };
    const request_body = JSON.stringify({});
    const response = await fetch(request_url, {
      method: request_method,
      headers: request_headers,
      body: request_body,
      mode: 'cors',
      credentials: 'include',
    });
    assert(response.headers.has('content-type') === true);
    assert(response.headers.get('content-type').includes('application/json') === true);
    const status = response.status;
    const body = await response.json();
    if (body instanceof Object) {
      if (body.data instanceof Object) {
        if (typeof body.data.token === 'string') {
          authenticated_token = body.data.token;
          authenticated_token_data = hs256.read_token(authenticated_token);
          queueMicrotask(save);
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
    const token_data = hs256.read_token(authenticated_token);
    assert(token_data instanceof Object);
    assert(token_data.payload instanceof Object);
    assert(typeof token_data.payload.exp === 'number');
    const exp = luxon.DateTime.fromSeconds(token_data.payload.exp);
    assert(exp.isValid === true);
    const now = luxon.DateTime.now();
    if (exp <= now) {
      authenticated_token = null;
      authenticated_token_data = null;
      queueMicrotask(save);
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
    const request_url = `${protocol}://${hostname}:${port}/sign-up`;
    const request_token = anon_token;
    const request_headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${request_token}`,
    };
    const request_body = JSON.stringify({ email: email, password: password });
    const response = await fetch(request_url, {
      method: request_method,
      headers: request_headers,
      body: request_body,
      mode: 'cors',
      credentials: 'include',
    });
    assert(response.headers.has('content-type') === true);
    assert(response.headers.get('content-type').includes('application/json') === true);
    const status = response.status;
    const body = await response.json();
    if (body instanceof Object) {
      if (body.data instanceof Object) {
        if (typeof body.data.token === 'string') {
          authenticated_token = body.data.token;
          authenticated_token_data = hs256.read_token(authenticated_token);
          queueMicrotask(save);
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
    const request_url = `${protocol}://${hostname}:${port}/sign-in`;
    const request_token = anon_token;
    const request_headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${request_token}`,
    };
    const request_body = JSON.stringify({ email: email, password: password });
    const response = await fetch(request_url, {
      method: request_method,
      headers: request_headers,
      body: request_body,
      mode: 'cors',
      credentials: 'include',
    });
    assert(response.headers.has('content-type') === true);
    assert(response.headers.get('content-type').includes('application/json') === true);
    const status = response.status;
    const body = await response.json();
    if (body instanceof Object) {
      if (body.data instanceof Object) {
        if (typeof body.data.token === 'string') {
          authenticated_token = body.data.token;
          authenticated_token_data = hs256.read_token(authenticated_token);
          queueMicrotask(save);
        }
      }
    }
    return { status, body };
  };

  const sign_out = async () => {
    assert(typeof authenticated_token === 'string', 'ERR_ALREADY_SIGNED_OUT');
    authenticated_token = null;
    authenticated_token_data = null;
    queueMicrotask(save);
    queueMicrotask(disable_interval);
    return null;
  };

  /**
   * @param {string} email
   */
  const read_user = async (email) => {
    assert(typeof email === 'string');
    assert(typeof authenticated_token === 'string', 'ERR_ALREADY_SIGNED_OUT');
    /**
     * @type {import('./postgrest').response<public_user[]>}
     */
    const response = await postgrest.request({
      protocol: protocol,
      hostname: hostname,
      port: 5433,
      token: authenticated_token,
      method: 'GET',
      headers: { 'Prefer': 'return=representation' },
      pathname: '/users',
      search: {
        email: `eq.${email}`,
      },
    });
    if (response.body instanceof Array) {
      if (response.body[0] instanceof Object) {
        return response.body[0];
      }
    }
    return null;
  };

  /**
   * @param {string} user_id
   * @param {string} role_id
   */
  const authorize = async (user_id, role_id) => {
    assert(typeof user_id === 'string');
    assert(typeof role_id === 'string');
    assert(typeof authenticated_token === 'string', 'ERR_ALREADY_SIGNED_OUT');
    /**
     * @type {assignment}
     */
    const assignment = { id: undefined, user_id: user_id, role_id: role_id };
    /**
     * @type {import('./postgrest').response<assignment[]>}
     */
    const assignment_response = await postgrest.request({
      protocol: protocol,
      hostname: hostname,
      port: 5433,
      token: authenticated_token,
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      pathname: '/assignments',
      json: assignment,
    });
    return assignment_response;
  };

  /**
   * @param {string} assignment_id
   */
  const deauthorize = async (assignment_id) => {
    assert(typeof assignment_id === 'string');
    /**
     * @type {import('./postgrest').response<assignment[]>}
     */
    const assignment_response = await postgrest.request({
      protocol: protocol,
      hostname: hostname,
      port: 5433,
      token: authenticated_token,
      method: 'DELETE',
      headers: { 'Prefer': 'return=representation' },
      pathname: '/assignments',
      search: {
        id: `eq.${assignment_id}`,
      },
    });
    return assignment_response;
  };

  /**
   * @param {string} scope
   * @returns {boolean}
   */
  const is_authorized = (scope) => {
    assert(typeof scope === 'string');
    const token_data = typeof authenticated_token === 'string' ? authenticated_token_data : anon_token_data;
    return token_data.payload.scopes.includes(scope);
  };

  const tokens = () => {
    return { anon_token, authenticated_token };
  };

  const client = {
    subscribers,
    subscribe,
    unsubscribe,
    refresh_token,
    check_refresh_token,
    sign_up,
    sign_in,
    sign_out,
    read_user,
    authorize,
    deauthorize,
    is_authorized,
    tokens,
  };
  return client;
};

export default initialize;