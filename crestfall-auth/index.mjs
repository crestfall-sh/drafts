// @ts-check

import assert from 'assert';
import readline from 'node:readline/promises';
import fetch from 'node-fetch';
import * as uwu from 'modules/uwu.mjs';

import * as jwt from './hs256.mjs';
import env from '../env.mjs';

console.log({ env });

assert(env.has('PGRST_JWT_SECRET') === true);
assert(env.has('PGRST_JWT_SECRET_IS_BASE64') === true);
assert(env.get('PGRST_JWT_SECRET_IS_BASE64') === 'true');

const secret = env.get('PGRST_JWT_SECRET');
console.log({ secret });

const rli = readline.createInterface({ input: process.stdin, output: process.stdout });

const readline_loop = async () => {
  const line = await rli.question('');
  switch (line) {
    case '/ct': {
      const header = { alg: 'HS256', typ: 'JWT' };
      console.log({ header });
      const payload = { role: 'anon' };
      console.log({ payload });
      const token = jwt.create_token(header, payload, secret);
      console.log({ token });
      const verified = jwt.verify_token(token, secret);
      console.log({ verified });
      break;
    }
    default: {
      console.log(`Unhandled: ${line}`);
      break;
    }
  }
  process.nextTick(readline_loop);
};
process.nextTick(readline_loop);

