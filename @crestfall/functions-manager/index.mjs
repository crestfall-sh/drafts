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

/**
 * @param {string} owner
 * @param {string} repository
 */
const get_commits = async (owner, repository) => {
  assert(typeof owner === 'string');
  assert(typeof repository === 'string');
  const url = new URL('https://api.github.com/');
  url.pathname = `/repos/${owner}/${repository}/commits`;
  url.searchParams.set('type', 'private');
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(response.status === 200);
  assert(response.headers.has('content-type') === true);
  assert(response.headers.get('content-type').includes('application/json') === true);
  /**
   * @type {import('./index').commit[]}
   */
  // @ts-ignore
  const commits = await response.json();
  assert(commits instanceof Array);
  return commits;
};

/**
 * @param {string} owner
 * @param {string} repository
 * @param {string} reference
 * @description downloads and extracts the repository tarball.
 */
const get_tarball = async (owner, repository, reference) => {
  assert(typeof owner === 'string');
  assert(typeof repository === 'string');
  assert(typeof reference === 'string');
  const reference_short = reference.substring(0, 7);
  const url = new URL('https://api.github.com/');
  url.pathname = `/repos/${owner}/${repository}/tarball/${reference}`;
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(response.status === 200);
  assert(response.headers.has('content-type') === true);
  assert(response.headers.get('content-type').includes('application/x-gzip') === true);
  const data = await response.arrayBuffer();
  const data_buffer = Buffer.from(data);
  const snapshot_id = `${owner}-${repository}-${reference_short}`;
  const snapshot_tarball_path = path.join(process.cwd(), `${snapshot_id}.tar.gz`);
  fs.writeFileSync(snapshot_tarball_path, data_buffer);
  child_process.spawnSync('tar', ['--extract', '--ungzip', `--file=${snapshot_tarball_path}`]);
  const snapshot_directory_path = path.join(process.cwd(), snapshot_id);
  fs.unlinkSync(snapshot_tarball_path);
  const snapshot = {
    owner,
    repository,
    reference,
    reference_short,
    snapshot_id,
    snapshot_directory_path,
  };
  return snapshot;
};

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
    case 'tar': {
      const owner = 'joshxyzhimself';
      const repository = 'example-functions';
      const commits = await get_commits(owner, repository);
      assert(commits instanceof Array);
      const commit = commits[0];
      assert(commit instanceof Object);
      const snapshot = await get_tarball(owner, repository, commit.sha);
      console.log(snapshot);
      break;
    }
    default: {
      break;
    }
  }
});