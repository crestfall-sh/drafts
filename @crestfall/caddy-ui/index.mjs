// @ts-check

import fetch from 'node-fetch';

const argv = process.argv;

const command = argv[2];

console.log(argv);

process.nextTick(async () => {
  switch (command) {
    default: {
      break;
    }
  }
  console.log('asdas');
});