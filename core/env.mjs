// @ts-check

import fs from 'fs';
import path from 'path';
import assert from 'assert';

const env_file_path = path.join(process.cwd(), '.env');
assert(fs.existsSync(env_file_path) === true);

const env_file_data = fs.readFileSync(env_file_path, { encoding: 'utf-8' });

/**
 * @type {Map<string, string>}
 */
export const env = new Map();

env_file_data.split('\n').forEach((line) => {
  const [key, value] = line.split('=');
  env.set(key, value);
});

console.log({ env });

assert(env.has('PGRST_JWT_SECRET') === true);
assert(env.has('PGRST_JWT_SECRET_IS_BASE64') === true);
assert(env.get('PGRST_JWT_SECRET_IS_BASE64') === 'true');

export default env;