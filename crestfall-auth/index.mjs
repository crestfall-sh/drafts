// @ts-check

import assert from 'assert';
import crypto from 'crypto';
import env from '../env.mjs';

console.log({ env });

assert(env.has('PGRST_JWT_SECRET') === true);
assert(env.has('PGRST_JWT_SECRET_IS_BASE64') === true);
assert(env.get('PGRST_JWT_SECRET_IS_BASE64') === 'true');

const jwt_secret = Buffer.from(env.get('PGRST_JWT_SECRET'), 'base64');
console.log({ jwt_secret });