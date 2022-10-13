// @ts-check

import crypto from 'crypto';

const secret = crypto.randomBytes(32);
console.log(secret);

const secret_hex = secret.toString('hex');
console.log(`secret_hex: ${secret_hex}`);

const secret_base64 = secret.toString('base64');
console.log(`base64: ${secret_base64}`);