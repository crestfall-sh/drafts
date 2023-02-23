// @ts-check

import * as undici from 'undici';

process.nextTick(async () => {
  const unix_socket = '/var/run/docker.sock';
  const client = new undici.Client('http://localhost', {});
});