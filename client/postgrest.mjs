// @ts-check

/**
 * @typedef {import('./index').permission} permission
 * @typedef {import('./index').role} role
 * @typedef {import('./index').assignment} assignment
 */

import fetch from 'cross-fetch';
import assert from 'modules/assert.mjs';

/**
 * Note: used in browser and nodejs.
 * @type {import('./postgrest').request}
 */
export const request = async (options) => {
  assert(options instanceof Object);
  assert(typeof options.protocol === 'string');
  assert(typeof options.host === 'string');
  assert(typeof options.port === 'number');
  assert(typeof options.token === 'string');
  assert(options.method === undefined || typeof options.method === 'string');
  assert(options.headers === undefined || options.headers instanceof Object);
  assert(typeof options.pathname === 'string');
  assert(options.search === undefined || options.search instanceof Object);
  const request_token = options.token;
  const request_method = options.method || 'GET';
  const request_headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json; charset=utf-8',
    'Authorization': `Bearer ${request_token}`,
    'Accept-Profile': 'public', // For GET or HEAD
    'Content-Profile': 'public', // For POST, PATCH, PUT and DELETE
  };
  if (options.headers instanceof Object) {
    Object.assign(request_headers, options.headers);
  }
  const request_url = new URL(`${options.protocol}://${options.host}:${options.port}`);
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
  assert(response.headers.get('content-type').includes('application/json') === true || response.headers.get('content-type').includes('application/openapi+json') === true);
  const request_options = options;
  const status = response.status;
  const headers = response.headers;
  const body = await response.json();
  return { request_options, status, headers, body };
};

/**
 * @param {string} protocol
 * @param {string} host
 * @param {number} port
 * @param {string} token
 * @param {string} user_id
 * @returns {Promise<string[]>}
 */
export const read_authorization_scopes = async (protocol, host, port, token, user_id) => {
  assert(typeof protocol === 'string');
  assert(typeof host === 'string');
  assert(typeof port === 'number');
  assert(typeof token === 'string');
  assert(typeof user_id === 'string' || user_id === null);
  const method = 'GET';
  const pathname = '/assignments';
  /**
   * @type {Record<string, string>}
   */
  const search = {
    select: '*,role:roles(*,permissions:permissions(*))',
  };
  if (typeof user_id === 'string') {
    search.user_id = `eq.${user_id}`;
  }
  /**
   * @type {import('./postgrest').response<assignment[]>}
   */
  const response = await request({ protocol, host, port, token, method, pathname, search });
  assert(response.status === 200);
  assert(response.body instanceof Array);
  const scopes = new Set();
  const assignments = response.body;
  assignments.forEach((assignment) => {
    assert(assignment instanceof Object);
    assert(assignment.role instanceof Object);
    assert(assignment.role.permissions instanceof Array);
    assignment.role.permissions.forEach((permission) => {
      assert(permission instanceof Object);
      assert(permission.scopes instanceof Array);
      permission.scopes.forEach((scope) => {
        scopes.add(scope);
      });
    });
  });
  return Array.from(scopes);
};