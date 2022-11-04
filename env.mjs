// @ts-check

import fs from 'fs';
import url from 'url';
import path from 'path';
import assert from 'assert';

const directory_path = path.dirname(url.fileURLToPath(import.meta.url));
assert(fs.existsSync(directory_path) === true);

const file_path = path.join(directory_path, '.env');
assert(fs.existsSync(file_path) === true);

const file_data = fs.readFileSync(file_path, { encoding: 'utf-8' });

/**
 * @type {Map<string, string>}
 */
export const env = new Map();

file_data.split('\n').forEach((line) => {
  const [key, value] = line.split('=');
  env.set(key, value);
});

console.log({ env });

assert(env.has('PGRST_JWT_SECRET') === true);
assert(env.has('PGRST_JWT_SECRET_IS_BASE64') === true);
assert(env.get('PGRST_JWT_SECRET_IS_BASE64') === 'true');

export default env;