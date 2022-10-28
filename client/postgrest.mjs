// @ts-check

import fetch from 'cross-fetch';
import assert from 'modules/assert.mjs';

export const CRESTFALL_POSTGREST_PORT = 5433;

/**
 * Note: used in browser and nodejs.
 * @type {import('./postgrest').request}
 */
export const request = async (options) => {
  assert(options instanceof Object);
  assert(typeof options.protocol === 'string');
  assert(typeof options.host === 'string');
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
  const request_url = new URL(`${options.protocol}://${options.host}:${CRESTFALL_POSTGREST_PORT}`);
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
  const status = response.status;
  const headers = response.headers;
  const body = await response.json();
  return { status, headers, body };
};