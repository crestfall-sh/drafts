// @ts-check

import assert from 'assert';

/**
 * @param {Function} callback
 * @returns {void}
 * @description SIGTERM, killall node
 * @description SIGTSTP, ctrl + z
 * @description SIGINT, ctrl + c
 */
const on_exit = (callback) => {
  assert(callback instanceof Function);
  /**
   * @param {string} signal
   */
  const on_process_signal = (signal) => {
    assert(typeof signal === 'string');
    console.log(`\nCrestfall Functions: Process signal ${signal}`);
    process.exit(0);
  };
  /**
   * @param {number} code
   */
  const on_process_exit = (code) => {
    assert(typeof code === 'number');
    console.log(`Crestfall Functions: Process exit code: ${code}`);
    callback();
  };
  process.on('SIGTERM', on_process_signal);
  process.on('SIGTSTP', on_process_signal);
  process.on('SIGINT', on_process_signal);
  process.on('exit', on_process_exit);
};

export default on_exit;