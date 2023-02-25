// @ts-check

import * as scrypt from './scrypt.mjs';

const password = 'test1234';
const password_salt = scrypt.salt();
const password_key_buffer = scrypt.derive(password, password_salt);
const password_key = password_key_buffer.toString('hex');

console.log({ password, password_salt, password_key });