// @ts-check

// make it work on cli first, before creating a gui for it.
// curl as the user interface should work for most cases, same for caddy ui

import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import assert from 'assert';
import fetch from 'node-fetch';

const argv = process.argv;

const token = argv[2];
assert(typeof token === 'string', 'process.argv[2] "token" must be a string.');
console.log(`token: ${token}`);

const action = argv[3];
assert(typeof action === 'string', 'process.argv[3] "action" must be a string.');
console.log(`action: ${action}`);

/**
 * On GitHub, create a new fine-grained personal access token:
 * 1. Go to https://github.com/settings/personal-access-tokens/new
 * 2. Set expiration to "90 days".
 * 3. Set repository access to "all repositories".
 * 4. Set repository "content" permissions to "read".
 * 5. Set repository "webhook" permissions to "read and write".
 * 6. Click "Generate token".
 * 7. Copy your new personal access token.
 *
 * Example access token:
 * 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
 *
 */

process.nextTick(async () => {
  switch (action) {
    case 'lr': {
      console.log('listing repositories..');
      const url = new URL('https://api.github.com/user/repos');
      url.searchParams.set('type', 'private');
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`status: ${response.status}`);
      assert(response.status === 200);
      console.log(`headers: ${response.headers}`);
      assert(response.headers.has('content-type') === true);
      assert(response.headers.get('content-type').includes('application/json') === true);
      /**
       * @type {import('./index').repository[]}
       */
      // @ts-ignore
      const repositories = await response.json();
      assert(repositories instanceof Array);
      repositories.forEach((repository) => {
        console.log(`${repository.name} ${repository.default_branch}`);
      });
      break;
    }
    case 'lc': {
      console.log('listing commits..');
      const owner = 'joshxyzhimself';
      const repository = 'example-functions';
      const url = new URL('https://api.github.com/');
      url.pathname = `/repos/${owner}/${repository}/commits`;
      url.searchParams.set('type', 'private');
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`status: ${response.status}`);
      assert(response.status === 200);
      console.log(`headers: ${response.headers}`);
      assert(response.headers.has('content-type') === true);
      assert(response.headers.get('content-type').includes('application/json') === true);
      /**
       * @type {import('./index').commit[]}
       */
      // @ts-ignore
      const commits = await response.json();
      assert(commits instanceof Array);
      console.log(JSON.stringify({ commits }, null, 2));
      break;
    }
    case 'tar': {
      console.log('fetching tarball..');
      const owner = 'joshxyzhimself';
      const repository = 'example-functions';
      const reference = 'e115704494f8855eae4eb856eb1f96aff0d4187c';
      console.log({ reference });
      const reference_short = reference.substring(0, 7);
      console.log({ reference_short });
      const url = new URL('https://api.github.com/');
      url.pathname = `/repos/${owner}/${repository}/tarball/${reference}`;
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`status: ${response.status}`);
      assert(response.status === 200);
      console.log(`headers: ${response.headers}`);
      assert(response.headers.has('content-type') === true);
      assert(response.headers.get('content-type').includes('application/x-gzip') === true);
      console.log(response.headers.get('content-type'));
      const data = await response.arrayBuffer();
      const data_buffer = Buffer.from(data);
      console.log({ data_buffer });
      const snapshot_id = `${owner}-${repository}-${reference_short}`;
      console.log({ snapshot_id });
      const snapshot_tarball_path = path.join(process.cwd(), `${snapshot_id}.tar.gz`);
      console.log({ snapshot_tarball_path });
      fs.writeFileSync(snapshot_tarball_path, data_buffer);
      child_process.spawnSync('tar', ['--extract', '--ungzip', `--file=${snapshot_tarball_path}`]);
      const snapshot_extract_path = path.join(process.cwd(), snapshot_id);
      console.log(snapshot_extract_path, fs.existsSync(snapshot_extract_path));
      fs.unlinkSync(snapshot_tarball_path);
      break;
    }
    default: {
      break;
    }
  }
});